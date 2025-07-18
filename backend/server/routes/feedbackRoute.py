from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from typing import Optional, List, Dict, Any
import asyncio
import smtplib, ssl, os
from email.message import EmailMessage
from urllib.parse import quote
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter()

# Pydantic model for the update request body
class FeedbackUpdate(BaseModel):
    is_not_solved: Optional[bool] = None # Renamed from is_addressed
    is_solved: Optional[bool] = None

@router.post("/streamer")
async def submit_streamer_feedback(
    request: Request,
    feedback: str = Form(...),
    userId: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    Endpoint to submit streamer feedback.
    Saves feedback to the database and sends an acknowledgment email.
    """
    try:
        support_db = request.app.state.support_db
        user_db = request.app.state.user_db

        feedback_collection = support_db["feedback"]

        user = user_db["streamer"].find_one({"userId": userId})
        if not user or "email" not in user:
            raise HTTPException(status_code=400, detail="User email not found.")

        feedback_data = {
            "userId": userId,
            "feedback": feedback,
            "timestamp": datetime.utcnow(),
            "is_not_solved": True,  # New feedback is initially 'Not Solved'
            "is_solved": False,     # And definitely not 'Solved'
        }

        if file:
            file_content = await file.read()
            feedback_data["fileName"] = file.filename
            feedback_data["fileContent"] = file_content

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, feedback_collection.insert_one, feedback_data)

        if result.inserted_id:
            try:
                email_user = os.getenv("EMAIL_USER")
                email_pass = os.getenv("EMAIL_PASS")

                msg = EmailMessage()
                msg["Subject"] = "Thanks for Your Feedback - CineIt"
                msg["From"] = email_user
                msg["To"] = user["email"]
                msg.set_content(f"""Hi {user.get('username', 'there')},

Thank you for your feedback to CineIt!

We appreciate your input and will review it promptly.

Best Regards,
CineIt Support Team
""")

                context = ssl.create_default_context()
                with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
                    server.login(email_user, email_pass)
                    server.send_message(msg)
            except Exception as mail_error:
                print(f"⚠️ Email sending failed: {mail_error}")

            return {"message": "Feedback submitted successfully", "id": str(result.inserted_id)}

        raise HTTPException(status_code=500, detail="Failed to submit feedback: Insertion issue.")

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"❌ Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback due to an internal error.")


@router.get("/feedback", response_model=List[Dict[str, Any]])
async def get_all_feedback(request: Request):
    """
    Endpoint to retrieve all submitted user feedback.
    Returns a list of feedback entries, sorted by timestamp.
    """
    try:
        feedback_collection = request.app.state.support_db["feedback"]
        loop = asyncio.get_event_loop()
        feedback_cursor = await loop.run_in_executor(None, feedback_collection.find, {})
        
        feedback_list = []
        for doc in feedback_cursor:
            if "_id" in doc and isinstance(doc["_id"], ObjectId):
                doc["_id"] = str(doc["_id"])
            if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
                doc["timestamp"] = doc["timestamp"].isoformat() + "Z"
            
            # Handle old 'is_addressed' field for compatibility and new 'is_not_solved'
            # If 'is_not_solved' exists, use it. Otherwise, if 'is_addressed' exists, use that. Default to False.
            doc["is_not_solved"] = doc.get("is_not_solved", doc.get("is_addressed", False))
            doc["is_solved"] = doc.get("is_solved", False)
            
            # Remove the old 'is_addressed' field if it exists, to clean up data over time
            if "is_addressed" in doc:
                doc.pop("is_addressed")

            # Remove fileContent for GET /feedback endpoint to keep response small
            if "fileContent" in doc:
                doc.pop("fileContent")

            feedback_list.append(doc)
        
        feedback_list.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        return feedback_list
    except Exception as e:
        print(f"❌ Failed to retrieve feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve feedback due to an internal error.")

@router.patch("/feedback/{feedback_id}")
async def update_feedback_status(
    request: Request,
    feedback_id: str,
    update_data: FeedbackUpdate # Use the Pydantic model for request body
):
    """
    Endpoint to update the status (is_not_solved, is_solved) of a specific feedback entry.
    """
    try:
        support_db = request.app.state.support_db
        feedback_collection = support_db["feedback"]

        update_fields = update_data.dict(exclude_unset=True)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields provided for update.")

        loop = asyncio.get_event_loop()
        
        result = await loop.run_in_executor(
            None,
            feedback_collection.update_one,
            {"_id": ObjectId(feedback_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Feedback entry not found.")
        
        updated_feedback = await loop.run_in_executor(
            None,
            feedback_collection.find_one,
            {"_id": ObjectId(feedback_id)}
        )
        if updated_feedback:
            updated_feedback["_id"] = str(updated_feedback["_id"])
            if "timestamp" in updated_feedback and isinstance(updated_feedback["timestamp"], datetime):
                updated_feedback["timestamp"] = updated_feedback["timestamp"].isoformat() + "Z"
            
            # Ensure these fields are present in the response
            updated_feedback["is_not_solved"] = updated_feedback.get("is_not_solved", False)
            updated_feedback["is_solved"] = updated_feedback.get("is_solved", False)
            
            if "fileContent" in updated_feedback:
                updated_feedback.pop("fileContent")
            
            # If the old 'is_addressed' field exists, remove it from the response
            if "is_addressed" in updated_feedback:
                updated_feedback.pop("is_addressed")

            return updated_feedback
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve updated feedback.")

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"❌ Failed to update feedback status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update feedback status due to an internal error.")


@router.get("/feedback/{feedback_id}/attachment")
async def get_feedback_attachment(request: Request, feedback_id: str):
    """
    Endpoint to download an attachment for a specific feedback entry.
    """
    try:
        support_db = request.app.state.support_db
        feedback_collection = support_db["feedback"]

        loop = asyncio.get_event_loop()
        feedback_entry = await loop.run_in_executor(None, feedback_collection.find_one, {"_id": ObjectId(feedback_id)})

        if not feedback_entry:
            raise HTTPException(status_code=404, detail="Feedback entry not found.")
        
        if "fileContent" not in feedback_entry or not feedback_entry["fileContent"]:
            raise HTTPException(status_code=404, detail="No attachment found for this feedback.")

        from starlette.responses import StreamingResponse
        import io

        file_content = feedback_entry["fileContent"]
        file_name = feedback_entry.get("fileName", "attachment")
        
        content_type = "application/octet-stream"
        if file_name.endswith(".png"):
            content_type = "image/png"
        elif file_name.endswith(".jpg") or file_name.endswith(".jpeg"):
            content_type = "image/jpeg"
        elif file_name.endswith(".pdf"):
            content_type = "application/pdf"

        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename=\"{file_name}\""}
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"❌ Failed to retrieve attachment: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve attachment due to an internal error.")

