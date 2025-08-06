from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter()

class VerifyPasswordRequest(BaseModel):
    username: str
    userType: str
    currentPassword: str

class UpdatePasswordRequest(BaseModel):
    username: str
    userType: str
    newPassword: str

@router.post("/verify-password")
def verify_password(data: VerifyPasswordRequest, request: Request):
    db = request.app.state.user_db
    collection = db["admin"] if data.userType.lower() == "admin" else db["streamer"]

    user = collection.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["password"] != data.currentPassword:
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    return {"message": "Password verified."}

@router.post("/update-password")
def update_password(data: UpdatePasswordRequest, request: Request):
    db = request.app.state.user_db
    collection = db["admin"] if data.userType.lower() == "admin" else db["streamer"]

    user = collection.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    collection.update_one(
        {"username": data.username},
        {"$set": {"password": data.newPassword}}
    )

    return {"message": "Password updated successfully."}