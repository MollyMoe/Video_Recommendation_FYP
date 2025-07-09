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
    """
    Submits streamer feedback, including an optional file upload.
    Database operation is run in a thread pool to avoid blocking the event loop.
    """
    print(f"DEBUG: Received feedback submission request for userId: {userId}")
    print(f"DEBUG: Feedback content: {feedback[:50]}...") # Print first 50 chars of feedback

    try:
        db = request.app.state.support_db
        print(f"DEBUG: Accessed database object: {db.name}") # Should print 'support_db'

        feedback_collection = db["feedback"]
        print(f"DEBUG: Accessed collection: {feedback_collection.name}") # Should print 'feedback'

        feedback_data = {
            "userId": userId,
            "feedback": feedback,
            "timestamp": datetime.utcnow()
        }
        print(f"DEBUG: Initial feedback_data: {feedback_data}")

        if file:
            print(f"DEBUG: File detected: {file.filename}, content_type: {file.content_type}")
            file_content = await file.read()
            feedback_data["fileName"] = file.filename
            # WARNING: Storing large file content directly in MongoDB documents is not recommended.
            # It can hit the 16MB BSON document size limit and degrade performance.
            # For production, consider GridFS or cloud storage (S3, GCS, Cloudinary).
            feedback_data["fileContent"] = file_content
            print(f"DEBUG: File content size: {len(file_content)} bytes")
        else:
            print("DEBUG: No file uploaded.")

        print(f"DEBUG: Final feedback_data before insertion: {feedback_data}")

        loop = asyncio.get_event_loop()
        print("DEBUG: Attempting to insert feedback into MongoDB via run_in_executor...")

        result = await loop.run_in_executor(
            None,
            feedback_collection.insert_one,
            feedback_data
        )

        if result.inserted_id:
            print(f"✅ SUCCESS: Feedback successfully inserted with ID: {result.inserted_id}")
            return {"message": "Feedback submitted successfully", "id": str(result.inserted_id)}
        else:
            # This case indicates insert_one didn't raise an error but also didn't return an ID
            print("❌ ERROR: Feedback insertion failed, but no exception was raised by insert_one. inserted_id was None.")
            raise HTTPException(status_code=500, detail="Failed to submit feedback: Insertion issue.")

    except Exception as e:
        # This catches any exception during the entire process, including DB connection issues,
        # permission errors, or issues with the data itself (e.g., BSON size limit).
        print(f"❌ CRITICAL ERROR: Failed to submit feedback (exception caught): {e}")
        # Optionally, print the full traceback for more context
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {e}")