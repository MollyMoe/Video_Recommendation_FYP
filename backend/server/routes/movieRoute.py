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

#     userId = data.get("userId")
#     movieId = data.get("movieId")

#     user = await db.users.find_one({"userId": userId})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     await db.users.update_one(
#         {"userId": userId},
#         {"$addToSet": {"history": movieId}}
#     )
#     return {"message": "Added to history"}

# # For Like button

# @router.post("/like")
# async def add_to_liked_movies(request: Request):
#     data = await request.json()
#     db = request.app.state.user_db
#     user_collection = db["streamer"]
#     movie_collection = db["liked"]

#     userId = data.get("userId")
#     movieId = str(data.get("movieId"))

#     if not userId or not movieId:
#         raise HTTPException(status_code=400, detail="Missing userId or movieId")

#     user = user_collection.find_one({"userId": userId})  # ✅ no await
#     if not user:
#         raise HTTPException(status_code=404, detail="Streamer not found")

#     user_collection.update_one(
#         {"userId": userId},
#         {"$addToSet": {"likedMovies": movieId}}  # ✅ no await
#     )
#     return {"message": "Movie added to liked list"} 

@router.post("/like")
async def add_to_liked_movies(request: Request):
    data = await request.json()
    db = request.app.state.movie_db  # ✅ Corrected to point to movie_db
    liked_collection = db["liked"]

    userId = data.get("userId")
    movieId = data.get("movieId")  # keep as int or str depending on your schema

    if not userId or movieId is None:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    # Prevent duplicates using upsert-like logic
    existing = liked_collection.find_one({ "userId": userId, "movieId": movieId })
    if existing:
        return { "message": "Movie already liked" }

    liked_collection.insert_one({
        "userId": userId,
        "movieId": movieId
    })

    return { "message": "Movie added to liked list" }




# # For Save button
# @router.post("/save")
# async def add_to_watch_later(request: Request):
#     data = await request.json()
#     db = request.app.state.movie_db

#     userId = data.get("userId")
#     movieId = data.get("movieId")

#     user = await db.users.find_one({"userId": userId})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     await db.users.update_one(
#         {"userId": userId},
#         {"$addToSet": {"watchLater": movieId}}
#     )
#     return {"message": "Added to watch later"}


# # For Hide button
# @router.delete("/{movieId}")
# async def delete_movie(movieId: str, request: Request):
#     db = request.app.state.movie_db
#     try:
#         result = await db.hybridRecommendation.delete_one({"_id": ObjectId(movieId)})
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     if result.deleted_count == 1:
#         return {"message": "Movie deleted successfully"}
#     raise HTTPException(status_code=404, detail="Movie not found")

# # For History Page
# @router.get("/history/{userId}")
# async def get_user_history(userId: str, request: Request):
#     db = request.app.state.movie_db
#     user = await db.users.find_one({"userId": userId})
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
# @router.get("/likedMovies/{userId}")
# async def get_liked_movies(userId: str, request: Request):
#     print(f"🎯 Fetching liked movies for user: {userId}")
#     db = request.app.state
#     user_collection = db.user_db["streamer"]
#     movie_collection = db.movie_db["hybridRecommendation2"]
    

#     try:
#         user = user_collection.find_one({"userId": userId})
#         if not user:
#             print("❌ User not found")
#             raise HTTPException(status_code=404, detail="User not found")

#         liked_ids = user.get("likedMovies", [])
#         print("👍 likedMovies array (raw):", liked_ids)

#         # Convert to int (only if stored in DB as int)
#         try:
#             liked_ids = [int(mid) for mid in liked_ids]
#         except Exception as e:
#             print("❌ Error converting likedIds:", e)
#             raise HTTPException(status_code=400, detail="Invalid likedMovies data")

#         print("🔍 Final liked_ids used in query:", liked_ids)

#         # Fetch movies
#         movies_cursor = movie_collection.find({ "movieId": { "$in": liked_ids } })
#         movies = list(movies_cursor)
#         print(f"✅ {len(movies)} movie(s) fetched from hybridRecommendation2")

#         for movie in movies:
#             movie["_id"] = str(movie["_id"])

#         return { "likedMovies": movies }

#     except Exception as e:
#         print("🔥 Backend exception in likedMovies route:", e)
#         raise HTTPException(status_code=500, detail=str(e))

@router.get("/likedMovies/{userId}")
async def get_liked_movies(userId: str, request: Request):
    print(f"🎯 Fetching liked movies for user: {userId}")
    db = request.app.state.movie_db
    liked_collection = db["liked"]
    movie_collection = db["hybridRecommendation2"]

    try:
        liked_entries = list(liked_collection.find({"userId": userId}))
        movie_ids = list({entry["movieId"] for entry in liked_entries})  # ✅ unique set

        print("🎯 Unique liked movieIds:", movie_ids)

        movies = list(movie_collection.find({ "movieId": { "$in": movie_ids } }))
        for movie in movies:
            movie["_id"] = str(movie["_id"])

        print(f"✅ Returning {len(movies)} unique liked movies.")
        return { "likedMovies": movies }

    except Exception as e:
        print("🔥 Error in likedMovies route:", e)
        raise HTTPException(status_code=500, detail=str(e))



# # For Watch Later Page
# # @router.get("/movies/saved/{userId}")
# # async def get_saved_movies(userId: str, request: Request):
# #     db = request.app.state.movie_db
# #     user = await db.users.find_one({"userId": userId})
# #     if not user:
# #         raise HTTPException(status_code=404, detail="User not found")

# #     saved_ids = user.get("watchLater", [])
# #     movies = await db.hybridRecommendation.find(
# #         {"_id": {"$in": [ObjectId(mid) for mid in saved_ids]}}
# #     ).to_list(length=100)

# #     for movie in movies:
# #         movie["_id"] = str(movie["_id"])

# #     return movies

# # @router.get("/saved/{userId}")
# # async def get_saved_movies(userId: str, request: Request):
# #     db = request.app.state.movie_db
# #     user = await db.users.find_one({"userId": userId})
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

