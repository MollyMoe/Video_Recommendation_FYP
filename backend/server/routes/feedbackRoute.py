from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from typing import Optional

router = APIRouter()

@router.post("/feedback/streamer")
async def submit_streamer_feedback(
    request: Request,
    feedback: str = Form(...),
    userId: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    db = request.app.state.movie_db
    feedback_collection = db["feedback"]

    feedback_data = {
        "userId": userId,
        "feedback": feedback,
        "timestamp": datetime.utcnow()
    }

    if file:
        file_content = await file.read()
        feedback_data["fileName"] = file.filename
        feedback_data["fileContent"] = file_content  # For testing only; use file storage like GridFS or S3 in prod

    try:
        result = await feedback_collection.insert_one(feedback_data)
        return {"message": "Feedback submitted successfully", "id": str(result.inserted_id)}
    except Exception as e:
        print("❌ Failed to submit feedback:", e)
        raise HTTPException(status_code=500, detail="Failed to submit feedback")
