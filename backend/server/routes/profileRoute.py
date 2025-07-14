import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from datetime import datetime
from pathlib import Path 
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

router = APIRouter()
load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@router.put("/upload/{userType}/{userId}")
async def upload_profile_image(request: Request, userType: str, userId: str, profileImage: UploadFile = File(...)):
    db = request.app.state.user_db
    collection = db.admin if userType == "admin" else db.streamer

    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            profileImage.file,
            folder=f"CineIt/{userType}/{userId}",
            public_id="profile",  # always replace old profile picture
            overwrite=True,
        )

        image_url = upload_result["secure_url"]

        result = collection.find_one_and_update(
            {"userId": userId},
            {"$set": {"profileImage": image_url}},
            return_document=True
        )

        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Profile image updated", "profileImage": image_url}

    except Exception as e:

        raise HTTPException(status_code=500, detail="Upload failed")
