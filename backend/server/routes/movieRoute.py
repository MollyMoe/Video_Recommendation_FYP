# import math
# from fastapi import APIRouter, Request, HTTPException
# from fastapi.responses import JSONResponse

# router = APIRouter()

# @router.get("/all")
# def get_all_movies(request: Request):
#     db = request.app.state.movie_db
#     try:
#         # Fetch from your actual collection(comment out try)
#         movies = list(db.hybridRecommendation2.find().limit(25000))

#         for movie in movies:
#             movie["_id"] = str(movie["_id"])

#             # Replace all NaN values with None
#             for key, value in movie.items():
#                 if isinstance(value, float) and math.isnan(value):
#                     movie[key] = None

#         return JSONResponse(content=movies)
#     except Exception as e:
#         print("❌ Failed to fetch movies:", e)
#         raise HTTPException(status_code=500, detail="Failed to fetch movies")

# from fastapi import Body
# from typing import List

# @router.post("/regenerate")
# def regenerate_movies(
#     request: Request,
#     body: dict = Body(...)
# ):
#     db = request.app.state.movie_db
#     genres: List[str] = body.get("genres", [])
#     exclude_titles: List[str] = body.get("excludeTitles", [])

#     try:
#         query = {
#             "genres": {"$in": genres},
#             "title": {"$nin": exclude_titles},
#             "poster_url": {"$ne": None},
#             "trailer_url": {"$ne": None}
#         }

#         movies = list(db.hybridRecommendation2.find(query).limit(30))

#         for movie in movies:
#             movie["_id"] = str(movie["_id"])

#             for key, value in movie.items():
#                 if isinstance(value, float) and math.isnan(value):
#                     movie[key] = None

#         return JSONResponse(content=movies)
#     except Exception as e:
#         print("❌ Failed to regenerate movies:", e)
#         raise HTTPException(status_code=500, detail="Failed to regenerate movies")

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
        movies = list(db.hybridRecommendation2.find().limit(25000))  # use correct collection

        for movie in movies:
            movie["_id"] = str(movie["_id"])  # convert ObjectId to string
            for key, value in movie.items():
                if isinstance(value, float) and math.isnan(value):
                    movie[key] = None  # replace NaN with None

        return JSONResponse(content=movies)

    except Exception as e:
        print("❌ Failed to fetch movies:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch movies")


# POST /api/movies/regenerate — fetch new movies excluding current ones
# @router.post("/regenerate")
# def regenerate_movies(
#     request: Request,
#     body: dict = Body(...)
# ):
#     db = request.app.state.movie_db
#     genres: List[str] = body.get("genres", [])
#     exclude_titles: List[str] = body.get("excludeTitles", [])

#     try:
#         pipeline = [
#             {"$match": {
#                 "genres": {"$in": genres},
#                 "title": {"$nin": exclude_titles},
#                 "poster_url": {"$ne": None},
#                 "trailer_url": {"$ne": None}
#             }},
#             {"$group": {"_id": "$title", "doc": {"$first": "$$ROOT"}}},
#             {"$replaceRoot": {"newRoot": "$doc"}},
#             {"$limit": 30}
#         ]

#         movies = list(db.hybridRecommendation2.aggregate(pipeline))

#         for movie in movies:
#             movie["_id"] = str(movie["_id"])
#             for key, value in movie.items():
#                 if isinstance(value, float) and math.isnan(value):
#                     movie[key] = None

#         return JSONResponse(content=movies)

#     except Exception as e:

#         print("❌ Failed to regenerate movies:", e)
#         raise HTTPException(status_code=500, detail="Failed to regenerate movies")

#         print("❌ Failed to fetch movies:", e)
#         raise HTTPException(status_code=500, detail="Failed to fetch movies")

# For Play button
# @router.post("/history")
# async def add_to_history(request: Request):
#     data = await request.json()
#     db = request.app.state.movie_db

#     user_id = data.get("userId")
#     movie_id = data.get("movieId")

#     user = await db.users.find_one({"userId": user_id})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     await db.users.update_one(
#         {"userId": user_id},
#         {"$addToSet": {"history": movie_id}}
#     )
#     return {"message": "Added to history"}

# # For Like button

@router.post("/like")
async def add_to_liked_movies(request: Request):
    data = await request.json()
    db = request.app.state.user_db
    user_collection = db["streamer"]

    user_id = data.get("userId")
    movie_id = str(data.get("movieId"))

    if not user_id or not movie_id:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    user = user_collection.find_one({"userId": user_id})  # ✅ no await
    if not user:
        raise HTTPException(status_code=404, detail="Streamer not found")

    user_collection.update_one(
        {"userId": user_id},
        {"$addToSet": {"likedMovies": movie_id}}  # ✅ no await
    )
    return {"message": "Movie added to liked list"} 





# # For Save button
# @router.post("/save")
# async def add_to_watch_later(request: Request):
#     data = await request.json()
#     db = request.app.state.movie_db

#     user_id = data.get("userId")
#     movie_id = data.get("movieId")

#     user = await db.users.find_one({"userId": user_id})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     await db.users.update_one(
#         {"userId": user_id},
#         {"$addToSet": {"watchLater": movie_id}}
#     )
#     return {"message": "Added to watch later"}


# # For Hide button
# @router.delete("/{movie_id}")
# async def delete_movie(movie_id: str, request: Request):
#     db = request.app.state.movie_db
#     try:
#         result = await db.hybridRecommendation.delete_one({"_id": ObjectId(movie_id)})
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     if result.deleted_count == 1:
#         return {"message": "Movie deleted successfully"}
#     raise HTTPException(status_code=404, detail="Movie not found")

# # For History Page
# @router.get("/history/{user_id}")
# async def get_user_history(user_id: str, request: Request):
#     db = request.app.state.movie_db
#     user = await db.users.find_one({"userId": user_id})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     history_ids = user.get("history", [])
#     object_ids = [to_objectid_safe(mid) for mid in history_ids if to_objectid_safe(mid)]

#     movies = await db.hybridRecommendation.find(
#         {"_id": {"$in": object_ids}}
#     ).to_list(length=100)

#     for movie in movies:
#         movie["_id"] = str(movie["_id"])
#     return movies

# # For Liked Movies Page
@router.get("/likedMovies/{user_id}")
async def get_liked_movies(user_id: str, request: Request):
    db = request.app.state.user_db
    user_collection = db["streamer"]
    
    try:
        # Get the user
        user = user_collection.find_one({"userId": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        liked_ids = user.get("likedMovies", [])

        if not liked_ids:
            return {"likedMovies": []}

        # Fetch movie documents
        movies = list(db.hybridRecommendation2.find({"movieId": {"$in": liked_ids}}))
    
        # Convert ObjectId to string if needed
        for movie in movies:
            movie["_id"] = str(movie["_id"])

        return {"likedMovies": movies}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# # For Watch Later Page
# # @router.get("/movies/saved/{user_id}")
# # async def get_saved_movies(user_id: str, request: Request):
# #     db = request.app.state.movie_db
# #     user = await db.users.find_one({"userId": user_id})
# #     if not user:
# #         raise HTTPException(status_code=404, detail="User not found")

# #     saved_ids = user.get("watchLater", [])
# #     movies = await db.hybridRecommendation.find(
# #         {"_id": {"$in": [ObjectId(mid) for mid in saved_ids]}}
# #     ).to_list(length=100)

# #     for movie in movies:
# #         movie["_id"] = str(movie["_id"])

# #     return movies

# # @router.get("/saved/{user_id}")
# # async def get_saved_movies(user_id: str, request: Request):
# #     db = request.app.state.movie_db
# #     user = await db.users.find_one({"userId": user_id})
# #     if not user:
# #         raise HTTPException(status_code=404, detail="User not found")

# #     saved_ids = user.get("watchLater", [])
# #     object_ids = [to_objectid_safe(mid) for mid in saved_ids if to_objectid_safe(mid)]

# #     movies = await db.hybridRecommendation.find(
# #         {"_id": {"$in": object_ids}}
# #     ).to_list(length=100)

# #     for movie in movies:
# #         movie["_id"] = str(movie["_id"])
# #     return movies

