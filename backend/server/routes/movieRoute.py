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

# @router.post("/history")
# async def add_to_history(request: Request):
#     data = await request.json()
#     db = request.app.state.movie_db
#     history_collection = db["history"]

#     user_id = data.get("userId")
#     movie_id = data.get("movieId")

#     if not user_id or movie_id is None:
#         raise HTTPException(status_code=400, detail="Missing userId or movieId")

#     # Ensure movie_id matches the data type stored in MongoDB
#     try:
#         movie_id = int(movie_id)
#     except (ValueError, TypeError):
#         pass  # keep as string if it fails

#     try:
#         # Remove from history if it exists
#         await history_collection.update_one(
#             {"userId": user_id},
#             {"$pull": {"historyMovies": movie_id}},
#         )

#         # Add to end
#         await history_collection.update_one(
#             {"userId": user_id},
#             {"$push": {"historyMovies": movie_id}},
#             upsert=True
#         )

#         return {"message": "Movie moved to end of history"}
#     except Exception as e:
#         print("❌ Error saving history:", e)
#         raise HTTPException(status_code=500, detail="Failed to save history")


@router.post("/history")
async def add_to_history(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    history_collection = db["history"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or movie_id is None:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    try:
        movie_id = int(movie_id)
    except (ValueError, TypeError):
        pass  # Keep as string

    try:
        # ✅ Remove existing entry (synchronously)
        history_collection.update_one(
            {"userId": user_id},
            {"$pull": {"historyMovies": movie_id}}
        )

        # ✅ Add new entry to the end (synchronously)
        history_collection.update_one(
            {"userId": user_id},
            {"$push": {"historyMovies": movie_id}},
            upsert=True
        )

        return {"message": "Movie moved to end of history"}

    except Exception as e:
        print("❌ Error saving history:", e)
        raise HTTPException(status_code=500, detail="Failed to save history")


@router.get("/historyMovies/{userId}")
def get_history_movies(userId: str, request: Request):
    try:
        db = request.app.state.movie_db
        history_collection = db["history"]
        movies_collection = db["hybridRecommendation2"]

        history_doc = history_collection.find_one({"userId": userId})
        if not history_doc or not history_doc.get("historyMovies"):
            return {"historyMovies": []}

        history_ids = history_doc["historyMovies"]

        movies_cursor = movies_collection.find(
            {"movieId": {"$in": history_ids}},
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

        return {"historyMovies": unique_movies}

    except Exception as e:
        print("❌ Error fetching history movies:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch history movies")
    

    
@router.post("/watchLater")
async def add_to_watchLater(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    watchLater_collection = db["saved"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or not movie_id:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    # Use $addToSet to avoid duplicate entries in history
    await watchLater_collection.update_one(
        {"userId": user_id},
        {"$addToSet": {"SaveMovies": movie_id}},
        upsert=True
    )

    return {"message": "Movie saved to watch later"}



@router.get("/watchLater/{userId}")
def get_watchLater_movies(userId: str, request: Request):
    try:
        db = request.app.state.movie_db
        watchLater_collection = db["saved"]
        movies_collection = db["hybridRecommendation2"]

        save = watchLater_collection.find_one({"userId": userId})
        if not save or not save.get("SaveMovies"):
            return {"SaveMovies": []}

        saveMovie_ids = save["SaveMovies"]

        movies_cursor = movies_collection.find(
            {"movieId": {"$in": saveMovie_ids}},
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

        return {"SaveMovies": unique_movies}

    except Exception as e:
        print("❌ Error fetching saved movies:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch saved movies")
    
# @router.post("/unlike")
# def remove_from_liked_movies(request: Request, data: dict = Body(...)):
#     db = request.app.state.movie_db
#     liked_collection = db["liked"]

#     user_id = data.get("userId")
#     movie_id = data.get("movieId")

#     if not user_id or movie_id is None:
#         raise HTTPException(status_code=400, detail="Missing userId or movieId")

#     try:
#         movie_id = int(movie_id)
#     except (ValueError, TypeError):
#         pass

#     result = liked_collection.update_one(
#         {"userId": user_id},
#         {"$pull": {"likedMovies": movie_id}}
#     )

#     if result.modified_count > 0:
#         return {"message": "Movie removed from liked list"}
#     else:
#         return {"message": "Movie not found or already removed"}
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
@router.get("/recommendations/{userId}")
def get_user_recommendations(userId: str, request: Request):
    db = request.app.state.movie_db
    try:
        record = db.recommended.find_one({ "userId": userId })
        if not record:
            return JSONResponse(content=[])  

        return JSONResponse(content=record.get("recommended", []))
    except Exception as e:
        print("❌ Error fetching recommendations:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")
