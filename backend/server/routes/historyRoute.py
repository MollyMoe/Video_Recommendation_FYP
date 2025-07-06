from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from pymongo import MongoClient
from bson import ObjectId

router = APIRouter()

# ✅ Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["MovieDatabase"]
history_collection = db["history"]
movies_collection = db["hybridRecommendation"]

# ✅ Request body model
class HistoryEntry(BaseModel):
    userId: str
    movieId: str  # MongoDB ObjectId as string
    watchedAt: Optional[datetime] = datetime.utcnow()

# ✅ POST: Add to history (with duplicate check)
@router.post("/api/history/add")
def add_to_history(entry: HistoryEntry):
    try:
        # Check for existing entry
        existing = history_collection.find_one({
            "userId": entry.userId,
            "movieId": ObjectId(entry.movieId)
        })

        if existing:
            return {"message": "Already in history"}

        # Insert new record
        history_collection.insert_one({
            "userId": entry.userId,
            "movieId": ObjectId(entry.movieId),
            "watchedAt": entry.watchedAt
        })
        return {"message": "Movie added to history"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ GET: Fetch enriched history for a user
@router.get("/api/history/{user_id}")
def get_user_history(user_id: str):
    try:
        history_entries = list(history_collection.find({"userId": user_id}))
        enriched_history = []

        for entry in history_entries:
            movie = movies_collection.find_one({"_id": entry["movieId"]})
            if movie:
                enriched_history.append({
                    "title": movie.get("title", "Unknown"),
                    "poster_url": movie.get("poster_url"),
                    "genres": movie.get("genres", []),
                    "predicted_rating": movie.get("predicted_rating", "N/A"),
                    "watchedAt": entry.get("watchedAt")
                })

        return enriched_history

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
