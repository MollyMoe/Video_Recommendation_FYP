
import math
from typing import List
from fastapi import APIRouter, Request, HTTPException, Body
from fastapi.responses import JSONResponse
from bson import ObjectId, errors
from pydantic import BaseModel
from typing import Optional, List, Union

class Movie(BaseModel):
    _id: Optional[str]  # ObjectId as string
    movieId: Union[str, int]
    predicted_rating: Optional[float]
    title: Optional[str]
    genres: Union[str, List[str], None]
    tmdb_id: Optional[Union[str, int]]
    poster_url: Optional[str]
    trailer_key: Optional[str] = None
    trailer_url: Optional[str] = None
    overview: Optional[str]
    director: Optional[str]
    producers: Optional[str]
    actors: Optional[str]

def to_objectid_safe(id_str):
    try:
        return ObjectId(id_str)
    except (errors.InvalidId, TypeError):
        return None

router = APIRouter()

@router.get("/all")
def get_all_movies(request: Request):
    db = request.app.state.movie_db
    try:

        # Fetch from your actual collection
        movies = list(db.hybridRecommendation2.find().limit(25000))


        for movie in movies:
            movie["_id"] = str(movie["_id"])  # convert ObjectId to string
            for key, value in movie.items():
                if isinstance(value, float) and math.isnan(value):
                    movie[key] = None  # replace NaN with None

        return JSONResponse(content=movies)

    except Exception as e:
        print("❌ Failed to fetch movies:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch movies")

# to like
@router.post("/like")
async def add_to_liked_movies(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    liked_collection = db["liked"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")  # Keep as string if that's what your frontend uses

    if not user_id or not movie_id:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    # Use $addToSet to avoid duplicates
    await liked_collection.update_one(
        {"userId": user_id},
        {"$addToSet": {"likedMovies": movie_id}},
        upsert=True  # Create the document if it doesn't exist
    )

    return {"message": "Movie added to liked list"}

# for liked Movies page
@router.get("/likedMovies/{userId}")
def get_liked_movies(userId: str, request: Request):
    db = request.app.state.movie_db
    liked_collection = db["liked"]
    movies_collection = db["hybridRecommendation2"]

    liked_doc = liked_collection.find_one({"userId": userId})
    if not liked_doc or not liked_doc.get("likedMovies"):
        return {"likedMovies": []}

    liked_ids = liked_doc["likedMovies"]  # e.g., [287149, 186015]

    # Get all matching movies
    movies_cursor = movies_collection.find(
        {"movieId": {"$in": liked_ids}},
        {"_id": 1, "movieId": 1, "poster_url": 1, "title": 1}
    )

    # Remove duplicates by movieId
    seen = set()
    unique_movies = []
    for movie in movies_cursor:
        mid = movie.get("movieId")
        if mid not in seen:
            seen.add(mid)
            movie["_id"] = str(movie["_id"])
            unique_movies.append(movie)

    return {"likedMovies": unique_movies}


# POST /api/movies/regenerate — fetch new movies excluding current ones
@router.post("/regenerate")
def regenerate_movies(
    request: Request,
    body: dict = Body(...)
):
    db = request.app.state.movie_db
    genres: List[str] = body.get("genres", [])
    exclude_titles: List[str] = body.get("excludeTitles", [])

    try:
        pipeline = [
            {"$match": {
                "genres": {"$in": genres},
                "title": {"$nin": exclude_titles},
                "poster_url": {"$ne": None},
                "trailer_url": {"$ne": None}
            }},
            {"$group": {"_id": "$title", "doc": {"$first": "$$ROOT"}}},
            {"$replaceRoot": {"newRoot": "$doc"}},
            {"$limit": 30}
        ]

        movies = list(db.hybridRecommendation2.aggregate(pipeline))
        
        for movie in movies:
            movie["_id"] = str(movie["_id"])
            for key, value in movie.items():
                if isinstance(value, float) and math.isnan(value):
                    movie[key] = None

        return JSONResponse(content=movies)

    except Exception as e:
        print("❌ Failed to regenerate movies:", e)
        
    raise HTTPException(status_code=500, detail="Failed to regenerate movies")

# store recommendations in a collection
@router.post("/store-recommendations")
async def store_recommendations(
    request: Request,
    payload: dict = Body(...)
):
    db = request.app.state.movie_db
    user_id = payload.get("userId")
    movies = payload.get("movies", [])

    if not user_id or not isinstance(movies, list):
        return JSONResponse(status_code=400, content={"error": "Invalid request"})

    try:
        db.recommended.update_one(
            { "userId": user_id },
            { "$set": { "recommended": movies } },
            upsert=True
        )
        return { "message": "Recommendations saved to 'recommended' collection." }
    except Exception as e:
        print("❌ Error saving recommendations:", e)
        return JSONResponse(status_code=500, content={"error": "Failed to save recommendations"})

# when new data is regenrated it will stay that way 
@router.get("/recommendations/{user_id}")
def get_user_recommendations(user_id: str, request: Request):
    db = request.app.state.movie_db
    try:
        record = db.recommended.find_one({ "userId": user_id })
        if not record:
            return JSONResponse(content=[])  

        return JSONResponse(content=record.get("recommended", []))
    except Exception as e:
        print("❌ Error fetching recommendations:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")

# for filter recommendation page
@router.post("/filter")
async def filter_recommendations(request: Request, body: dict = Body(...)):
    user_id = body.get("userId")
    query = body.get("query", "").lower()

    db = request.app.state.movie_db
    recommended_collection = db["recommended"]

    if not user_id:
        return JSONResponse(content={"error": "Missing userId"}, status_code=400)

    # Filter by userId and optional query match in title/genres
    filters = { "userId": user_id }
    results = list(recommended_collection.find(filters))

    if query:
        results = [
            movie for movie in results
            if query in movie.get("title", "").lower()
            or query in " ".join(movie.get("genres", [])).lower()
        ]

    for movie in results:
        movie["_id"] = str(movie["_id"])

    return { "movies": results }