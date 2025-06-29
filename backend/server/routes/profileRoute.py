import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from datetime import datetime
from pathlib import Path 

router = APIRouter()
UPLOAD_DIR = Path("/tmp/uploads") if os.getenv("RENDER") else Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.put("/upload/{userType}/{userId}")
async def upload_profile_image(request: Request, userType: str, userId: str, profileImage: UploadFile = File(...)):
    db = request.app.state.user_db
    collection = db.admin if userType == "admin" else db.streamer

    try:
        filename = f"{profileImage.filename}"
        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as f:
            f.write(await profileImage.read())

        result = collection.find_one_and_update(
            {"userId": userId},
            {"$set": {"profileImage": f"/uploads/{filename}"}},
            return_document=True
        )

        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Profile image updated", "profileImage": f"/uploads/{filename}"}

    except Exception as e:
        print("❌ Upload Error:", e)
        raise HTTPException(status_code=500, detail="Upload failed")
