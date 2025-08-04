
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from bson import ObjectId
from pymongo import ReturnDocument
import bcrypt
import os
import smtplib
import ssl
import secrets
from email.message import EmailMessage
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path
from fastapi.responses import JSONResponse
from pymongo import ReturnDocument
from urllib.parse import quote

# Define the path to your .env file first
root_dir = Path(__file__).resolve().parents[2] 
env_path = root_dir / "server" / ".env"
load_dotenv(dotenv_path=env_path)
print("Looking for .env at:", env_path)

# Optional: print to confirm
print("EMAIL_USER =", os.getenv("EMAIL_USER"))

class SignUpRequest(BaseModel):
    fullName: str
    username: str
    email: EmailStr
    password: str
    userType: str  # should be either "admin" or "streamer"

router = APIRouter()

@router.get("/users/streamer")
def get_streamers(request: Request):
    db = request.app.state.user_db
    streamers = list(db.streamer.find({}, {"_id": 0}))
    print("Streamers fetched from DB:", streamers)
    return streamers

@router.post("/signup")
def signup(request: Request, user: SignUpRequest):
    db = request.app.state.user_db
    Model = db["admin"] if user.userType == "admin" else db["streamer"]
    DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dnbyospvs/image/upload/v1751267557/beff3b453bc8afd46a3c487a3a7f347b_tqgcpi.jpg"
    
    # Check if user already exists
    if Model.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    # Generate userId
    counter = db["counters"].find_one_and_update(
        {"_id": f"{user.userType}Id"},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        # return_document=True
        return_document=ReturnDocument.AFTER
    )

    user_id = f"U{str(counter['sequence_value']).zfill(3)}"

    # Build user document
    user_data = {
        "username": user.username,
        "password": user.password,
        "email": user.email,
        "fullName": user.fullName,
        "userType": user.userType,
        "status": "Active",
        "genres": [],
        "userId": user_id,
        "profileImage": DEFAULT_IMAGE_URL,
        "createdAt": datetime.utcnow(),
        "lastSignin": datetime.utcnow(),       # Stored as Date for queries
        "lastSignout": datetime.utcnow(),      # Stored as Date, not ISO string
        "__v": 0
    }

    # Save to DB
    Model.insert_one(user_data)

    return {
        "username": user.username,
        "userId": user_id,
        "userType": user.userType
    }
    
class SigninRequest(BaseModel):
    username: str
    password: str
    userType: str

@router.post("/signin")
def signin(data: SigninRequest, request: Request):
    db = request.app.state.user_db
    username = data.username
    password = data.password
    user_type = data.userType.lower()

    Model = db["admin"] if user_type == "admin" else db["streamer"]
    user = Model.find_one({"username": username}, {"_id": 0})

    if not user or user["password"] != password:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    user_id = user["userId"]
    now = datetime.utcnow()
    status = user.get("status", "Active")

    # ✅ Admins bypass inactivity logic
    if user_type == "admin":
        Model.update_one(
            { "userId": user_id },
            { "$set": { "lastSignin": now } }
        )
        return {
            "message": "Admin login successful",
            "user": user
        }

    # 🚫 Block login if already suspended
    if user_type == "streamer":
        if status != "Active":
            raise HTTPException(status_code=403, detail="Account is suspended.")

    # ⚠️ 1. Auto signout after 3 days of inactivity
    if user_type == "streamer":
    # 1️⃣ Check for auto-suspension (after 2 minutes since lastSignout)
        if user.get("lastSignout") and user.get("status") == "Active":
            signout_days = (now - user["lastSignout"]).days # put / 30 for months
            if signout_days >= 3:
                print(f"⛔ Auto-suspending {user['username']} after {signout_days:.2f} days")
                Model.update_one(
                    { "userId": user_id },
                    { "$set": { "status": "Suspended" } }
                )
                raise HTTPException(
                    status_code=403,
                    detail="Account suspended due to inactivity over 3 days."
                )

        # 2️⃣ Check for auto sign-out after inactivity (2 day)
        if user.get("lastSignin"):
            last_signin = user["lastSignin"]
            if isinstance(last_signin, str):
                last_signin = datetime.fromisoformat(last_signin)

            inactivity_days = (now - last_signin).days
            if inactivity_days >= 3:  # <-- Now 3 days instead of 2
                print(f"⚠️ Auto signout triggered after {inactivity_days} days")
                Model.update_one(
                    {"userId": user_id},
                    {"$set": {"lastSignout": now}}
                )

                user = Model.find_one({"userId": user_id}, {"_id": 0})
                return {
                    "message": "Re-logged in after session timeout.",
                    "user": {**user, "userType": user_type}
                }

        # Normal login path
        Model.update_one(
            {"userId": user_id},
            {"$set": {"lastSignin": now}}
)

        user = Model.find_one({ "userId": user_id }, {"_id": 0 })

        return {
            "message": "Login successful",
            "user": {
                **user,
                "userType": user_type
            }
        }


# @router.post("/signin")
# def signin(data: SigninRequest, request: Request):
#     db = request.app.state.user_db
#     username = data.username
#     password = data.password
#     user_type = data.userType.lower()

#     Model = db["admin"] if user_type == "admin" else db["streamer"]
#     user = Model.find_one({"username": username}, {"_id": 0})

#     if not user or user["password"] != password:
#         raise HTTPException(status_code=400, detail="Invalid username or password")

#     if user.get("status") == "Suspended":
#         raise HTTPException(status_code=403, detail="Account is suspended.")

#     return {"message": "Login successful", "user": user}


@router.delete("/delete/{userType}/{username}")
def delete_user(request: Request, userType: str, username: str):
    db = request.app.state.user_db
    user_type = userType.lower()
    Model = db["admin"] if user_type == "admin" else db["streamer"]

    result = Model.find_one_and_delete({"username": username})
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.post("/request-password-reset")
def request_password_reset(request: Request, body: dict):
    email = body.get("email")
    db = request.app.state.user_db

    for collection in [db.admin, db.streamer]:
        user = collection.find_one({"email": email})
        if user:
            token = secrets.token_hex(16)
            collection.update_one({"_id": user["_id"]}, {"$set": {"resetToken": token, "tokenExpiry": int(os.times()[4]*1000) + 3600000}})

            reset_url = f"https://cineit-frontend.onrender.com/#/reset-password-form?token={quote(token)}"
            message = EmailMessage()
            message.set_content(f"Click the link to reset password: {reset_url}")
            message["Subject"] = "Password Reset Request"
            message["From"] = os.getenv("EMAIL_USER")
            message["To"] = email

            context = ssl.create_default_context()
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
                server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
                server.send_message(message)
            return {"message": "Reset link sent"}

    raise HTTPException(status_code=404, detail="No user with that email")

@router.post("/reset-password")
def reset_password(request: Request, body: dict):
    token = body.get("token")
    password = body.get("password")
    db = request.app.state.user_db

    for collection in [db.admin, db.streamer]:
        user = collection.find_one({"resetToken": token, "tokenExpiry": {"$gt": int(os.times()[4]*1000)}})
        if user:
            collection.update_one({"_id": user["_id"]}, {"$set": {
                "password": password,
                "resetToken": None,
                "tokenExpiry": None
            }})
            return {"message": "Password has been reset successfully."}

    raise HTTPException(status_code=400, detail="Invalid or expired token")

from fastapi.encoders import jsonable_encoder

#Suspended
# @router.put("/users/{userId}/status")
# def update_status(request: Request, userId: str, body: dict):
#     db = request.app.state.user_db
#     status = body.get("status")

#     if status not in ["Active", "Suspended"]:
#         raise HTTPException(status_code=400, detail="Invalid status")

#     # Try updating in streamer collection first
#     result = db.streamer.find_one_and_update(
#         {"userId": userId},
#         {"$set": {"status": status}},
#         return_document=ReturnDocument.AFTER
#     )

#     if result:
#         result["_id"] = str(result["_id"])
#         return JSONResponse(content=result)

#     raise HTTPException(status_code=404, detail="User not found")

@router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, request: Request):
    try:
        body = await request.json()
        status = body.get("status")
        user_type = body.get("userType")

        print("🧪 Received:", {
            "userId": user_id,
            "userType": user_type,
            "status": status
        })

        if not status or not user_type:
            raise HTTPException(status_code=400, detail="Missing status or userType")

        db = request.app.state.user_db
        Model = db["admin"] if user_type.lower() == "admin" else db["streamer"]

        # ✅ Try finding the user first to confirm they exist
        user = Model.find_one({ "userId": user_id })
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        result = db.streamer.find_one_and_update(
            { "userId": user_id },
            { "$set": { "status": status } }
        )

        print(f"✅ Updated {user_id} to {status}")
        return { "message": f"User {user_id} status updated to {status}" }

    except Exception as e:
        print("🚨 Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/preferences")
def update_preferences(request: Request, body: dict):
    db = request.app.state.user_db
    user_id = body.get("userId")
    genres = body.get("genres")

    if not user_id or not genres:
        raise HTTPException(status_code=400, detail="userId and genres are required")

    updated = db.streamer.find_one_and_update(
        {"userId": user_id},
        {"$set": {"genres": genres}},
        return_document=ReturnDocument.AFTER
    )

    if not updated:
        updated = db.admin.find_one_and_update(
            {"userId": user_id},
            return_document=ReturnDocument.AFTER
        )

    if updated:
        updated["_id"] = str(updated["_id"])  # Optional: for JSON safety
        return {"message": "Preferences updated", "user": updated}

    raise HTTPException(status_code=404, detail="User not found")

@router.get("/by-username/{username}")
def get_by_username(request: Request, username: str):
    db = request.app.state.user_db
    user = db.streamer.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/{userType}/{userId}")
def get_user_by_id(request: Request, userType: str, userId: str):
    db = request.app.state.user_db
    collection = db.get_collection(userType)  # either "streamer" or "admin"

    user = collection.find_one({"userId": userId}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# @router.post("/update-signout-time")
# async def update_signout_time(request: Request):
#     body = await request.json()
#     user_id = body.get("userId")
#     user_type = body.get("userType")  # Needed to decide which collection
#     time_str = body.get("time")

#     if not user_id or not user_type:
#         raise HTTPException(status_code=400, detail="Missing userId or userType")

#     from dateutil.parser import parse
#     last_signout = parse(time_str) if time_str else datetime.utcnow()

#     db = request.app.state.user_db
#     Model = db["admin"] if user_type.lower() == "admin" else db["streamer"]

#     result = Model.update_one(
#         { "userId": user_id },
#         { "$set": { "lastSignout": last_signout } }
#     )

#     if result.modified_count == 0:
#         raise HTTPException(status_code=404, detail="User not found")

#     return {"message": "Sign-out time updated"}

from fastapi import APIRouter, Request, HTTPException
from datetime import datetime

@router.post("/update-signout-time")
async def update_signout_time(request: Request):
    body = await request.json()
    user_id = body.get("userId")
    user_type = body.get("userType")
    time_str = body.get("time")

    if not user_id or not user_type:
        raise HTTPException(status_code=400, detail="Missing userId or userType")

    try:
        last_signout = datetime.fromisoformat(time_str.replace("Z", "+00:00")) if time_str else datetime.utcnow()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {e}")

    db = request.app.state.user_db
    Model = db["admin"] if user_type.lower() == "admin" else db["streamer"]

    result = Model.update_one(
        { "userId": user_id },
        { "$set": { "lastSignout": last_signout } }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return { "message": "Sign-out time updated successfully" }

