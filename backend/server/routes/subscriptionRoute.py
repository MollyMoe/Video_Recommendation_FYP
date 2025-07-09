# server/routes/subscriptionRoute.py
from fastapi import APIRouter, Request
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/subscription/{userId}")
async def get_subscription(userId: str, request: Request):
    db = request.app.state.user_db
    user = db.users.find_one({"_id": userId})
    if not user:
        return {"status": "free", "expires_on": None}

    return user.get("subscription", {"status": "free", "expires_on": None})

@router.post("/subscription/{userId}/subscribe")
async def subscribe(userId: str, request: Request):
    db = request.app.state.user_db
    expires_on = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    db.users.update_one(
        {"_id": userId},
        {"$set": {"subscription": {"status": "pro", "expires_on": expires_on}}},
        upsert=True
    )
    return {"status": "pro", "expires_on": expires_on}

@router.post("/subscription/{userId}/unsubscribe")
async def unsubscribe(userId: str, request: Request):
    db = request.app.state.user_db
    db.users.update_one(
        {"_id": userId},
        {"$set": {"subscription": {"status": "free", "expires_on": None}}}
    )
    return {"status": "free", "expires_on": None}
