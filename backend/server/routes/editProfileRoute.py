from fastapi import APIRouter, Request, HTTPException, Body
from pymongo import ReturnDocument
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.put("/admin/{userId}")
def update_admin(request: Request, userId: str, body: dict = Body(...)):
    db = request.app.state.user_db
    username = body.get("username")

    if not username:
        raise HTTPException(status_code=400, detail="Missing username")

    updated_user = db.admin.find_one_and_update(
        {"userId": userId},
        {"$set": {"username": username}},
        return_document=ReturnDocument.AFTER
    )

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user["_id"] = str(updated_user["_id"])  # Fix ObjectId issue
    return updated_user

class StreamerUpdate(BaseModel):
    username: Optional[str] = None
    genre: Optional[str] = None

@router.put("/streamer/{userId}")
def update_streamer(request: Request, userId: str, body: StreamerUpdate):
    db = request.app.state.user_db
    update_fields = {}

    if body.username:
        update_fields["username"] = body.username

    if body.genre:
        update_fields["genres"] = [g.strip() for g in body.genre.split(",") if g.strip()]

    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    updated_user = db.streamer.find_one_and_update(
        {"userId": userId},
        {"$set": update_fields},
        return_document=ReturnDocument.AFTER
    )

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user["_id"] = str(updated_user["_id"])
    return updated_user