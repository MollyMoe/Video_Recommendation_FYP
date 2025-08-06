from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse

router = APIRouter()

class GenreRequest(BaseModel):
    username: str
    genres: list[str]

@router.post("/preference/genre")
async def update_genres(data: GenreRequest, request: Request):
    db = request.app.state.user_db
    collection = db["streamer"]  # your MongoDB collection is named 'streamer'

    user = collection.find_one({"username": data.username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        collection.update_one(
            {"username": data.username},
            {"$set": {"genres": data.genres}}
        )
        return JSONResponse(content={"message": "Preferences updated successfully"}, status_code=200)
    except Exception as e:
        print("Error saving preferences:", e)

        raise HTTPException(status_code=500, detail="Internal server error")