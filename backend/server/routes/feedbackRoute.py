from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from typing import Optional
import asyncio
import smtplib, ssl, os
from email.message import EmailMessage
from urllib.parse import quote

router = APIRouter()

@router.post("/streamer")
async def submit_streamer_feedback(
    request: Request,
    feedback: str = Form(...),
    userId: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    try:
        support_db = request.app.state.support_db
        user_db = request.app.state.user_db

        feedback_collection = support_db["feedback"]

        # Lookup user email from userId
        user = user_db["streamer"].find_one({"userId": userId})
        if not user or "email" not in user:
            raise HTTPException(status_code=400, detail="User email not found.")

        feedback_data = {
            "userId": userId,
            "feedback": feedback,
            "timestamp": datetime.utcnow()
        }

        if file:
            file_content = await file.read()
            feedback_data["fileName"] = file.filename
            feedback_data["fileContent"] = file_content

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, feedback_collection.insert_one, feedback_data)

        if result.inserted_id:
            # Send acknowledgment email
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

    except Exception as e:
        print(f"❌ Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback.")