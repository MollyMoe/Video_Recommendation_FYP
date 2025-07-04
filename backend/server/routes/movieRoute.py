import math
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/all")
def get_all_movies(request: Request):
    db = request.app.state.movie_db
    try:
        # Fetch from your actual collection
        movies = list(db.hybridRecommendation2.find().limit(25000))

        for movie in movies:
            movie["_id"] = str(movie["_id"])

            # Replace all NaN values with None
            for key, value in movie.items():
                if isinstance(value, float) and math.isnan(value):
                    movie[key] = None

        return JSONResponse(content=movies)
    except Exception as e:
        print("❌ Failed to fetch movies:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch movies")

@router.post("/like")
async def add_to_liked_movies(request: Request):
    data = await request.json()
    db = request.app.state.user_db
    collection = db["streamer"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or not movie_id:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    user = collection.find_one({"userId": user_id})  # ✅ no await
    if not user:
        raise HTTPException(status_code=404, detail="Streamer not found")

    collection.update_one(
        {"userId": user_id},
        {"$addToSet": {"likedMovies": movie_id}}  # ✅ no await
    )

    return {"message": "Movie added to liked list"}

@router.get("/likedMovies/{userId}")
async def get_liked_movies(userId: str, request: Request):
    user = request.app.state.user_db["streamer"].find_one({"userId": userId})
    if not user:
        raise HTTPException(status_code=404, detail="Streamer not found")
    
    liked_ids = user.get("likedMovies", [])
    if not liked_ids:
        return {"likedMovies": []}

    # Fetch full movie docs
    movies = list(request.app.state.movie_db["movies"].find(
        {"_id": {"$in": liked_ids}},
        {"_id": 1, "poster_url": 1, "title": 1}
    ))
    return {"likedMovies": movies}