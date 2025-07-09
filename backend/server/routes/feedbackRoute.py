from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from typing import Optional
import asyncio

router = APIRouter()

@router.post("/streamer")
async def submit_streamer_feedback(
    request: Request,
    feedback: str = Form(...),
    userId: str = Form(...),
    file: Optional[UploadFile] = File(None)
):

    try:
        db = request.app.state.support_db
        feedback_collection = db["feedback"]

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

        result = await loop.run_in_executor(
            None,
            feedback_collection.insert_one,
            feedback_data
        )

        if result.inserted_id:
            return {"message": "Feedback submitted successfully", "id": str(result.inserted_id)}
        else:
            # This case indicates insert_one didn't raise an error but also didn't return an ID
            raise HTTPException(status_code=500, detail="Failed to submit feedback: Insertion issue.")

    except Exception as e:
        print(f"❌ Failed to submit feedback: {e}") # Keep a basic error print for server logs
        raise HTTPException(status_code=500, detail="Failed to submit feedback")