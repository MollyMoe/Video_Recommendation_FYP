from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from typing import Optional
import asyncio

router = APIRouter()

@router.post("/feedback/streamer")
async def submit_streamer_feedback(
    request: Request,
    feedback: str = Form(...),
    userId: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    Submits streamer feedback, including an optional file upload.
    Database operation is run in a thread pool to avoid blocking the event loop.
    """
    db = request.app.state.support_db # Assuming this is a PyMongo database object

    feedback_collection = db["feedback"]

    feedback_data = {
        "userId": userId,
        "feedback": feedback,
        "timestamp": datetime.utcnow()
    }

    if file:
        file_content = await file.read() # This is an async operation, so 'async def' is needed
        feedback_data["fileName"] = file.filename
        feedback_data["fileContent"] = file_content  # For testing only; use file storage like GridFS or S3 in prod

    try:
        # Get the current event loop
        loop = asyncio.get_event_loop()

        # Run the synchronous insert_one operation in a separate thread pool
        # This prevents the blocking database call from freezing the main event loop
        result = await loop.run_in_executor(
            None, # Use the default thread pool
            feedback_collection.insert_one, # The synchronous function to run
            feedback_data # Arguments to the function
        )
        return {"message": "Feedback submitted successfully", "id": str(result.inserted_id)}
    except Exception as e:
        print("❌ Failed to submit feedback:", e)
        raise HTTPException(status_code=500, detail="Failed to submit feedback")