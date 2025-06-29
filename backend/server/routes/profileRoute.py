import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
import cloudinary
import cloudinary.uploader

router = APIRouter()

@router.put("/upload/{userType}/{userId}")
async def upload_profile_image(request: Request, userType: str, userId: str, profileImage: UploadFile = File(...)):
    db = request.app.state.user_db
    collection = db.admin if userType == "admin" else db.streamer

    try:
        # Read the file content
        contents = await profileImage.read()

        # Upload to Cloudinary (replace if exists)
        result = cloudinary.uploader.upload(
            contents,
            folder="profile_images",
            public_id=f"profile_{userId}",
            overwrite=True
        )

        # Save the secure URL in database
        image_url = result["secure_url"]

        updated = await collection.find_one_and_update(
            {"userId": userId},
            {"$set": {"profileImage": image_url}},
            return_document=True
        )

        if not updated:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Profile image updated", "profileImage": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
