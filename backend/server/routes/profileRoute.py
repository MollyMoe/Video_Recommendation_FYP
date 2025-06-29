import cloudinary.uploader
from fastapi import APIRouter, UploadFile, File, HTTPException, Request

router = APIRouter()

@router.put("/upload/{userType}/{userId}")
async def upload_profile_image(
    request: Request,
    userType: str,
    userId: str,
    profileImage: UploadFile = File(...)
):
    db = request.app.state.user_db
    collection = db.admin if userType == "admin" else db.streamer

    try:
        # Read file contents
        contents = await profileImage.read()

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder="profile_images",
            public_id=f"profile_{userId}",  # replace existing image with same ID
            overwrite=True
        )

        image_url = result["secure_url"]

        # Save image URL to database
        updated = await collection.find_one_and_update(
            {"userId": userId},
            {"$set": {"profileImage": image_url}},
            return_document=True
        )

        if not updated:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Profile image uploaded", "profileImage": image_url}

    except Exception as e:
        print("Upload error:", e)
        raise HTTPException(status_code=500, detail="Upload failed")
