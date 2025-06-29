import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.put("/upload/{userType}/{userId}")
async def upload_profile_image(request: Request, userType: str, userId: str, profileImage: UploadFile = File(...)):
    db = request.app.state.user_db
    collection = db.admin if userType == "admin" else db.streamer

    # Save file
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    filename = f"{timestamp}-{profileImage.filename}"
    file_path = UPLOAD_DIR / filename

    try:
        with open(file_path, "wb") as f:
            content = await profileImage.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Update user profileImage path
    result = await collection.find_one_and_update(
        {"userId": userId},
        {"$set": {"profileImage": f"uploads/{filename}"}},
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Profile image updated", "profileImage": f"uploads/{filename}"}
