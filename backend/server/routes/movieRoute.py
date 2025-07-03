import math
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from bson import ObjectId, errors

def to_objectid_safe(id_str):
    try:
        return ObjectId(id_str)
    except (errors.InvalidId, TypeError):
        return None

router = APIRouter()

@router.get("/test")
async def test_route():
    return {"message": "movie router is working"}

@router.get("/all")
def get_all_movies(request: Request):
    db = request.app.state.movie_db
    try:
        # Fetch from your actual collection
        movies = list(db.hybridRecommendation.find().limit(25000))

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
# @router.post("/like")
# async def add_to_liked_movies(request: Request):
#     data = await request.json()
#     db = request.app.state.movie_db

#     user_id = data.get("userId")
#     movie_id = data.get("movieId")

#     user = await db.users.find_one({"userId": user_id})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     await db.users.update_one(
#         {"userId": user_id},
#         {"$addToSet": {"likedMovies": movie_id}}
#     )
#     return {"message": "Added to liked movies"}


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
# # @router.get("/movies/liked/{user_id}")
# # async def get_liked_movies(user_id: str, request: Request):
# #     db = request.app.state.movie_db
# #     user = await db.users.find_one({"userId": user_id})
# #     if not user:
# #         raise HTTPException(status_code=404, detail="User not found")

# #     liked_ids = user.get("likedMovies", [])
# #     movies = await db.hybridRecommendation.find(
# #         {"_id": {"$in": [ObjectId(mid) for mid in liked_ids]}}
# #     ).to_list(length=100)

# #     for movie in movies:
# #         movie["_id"] = str(movie["_id"])

# #     return movies
# # @router.get("/liked/{user_id}")
# # async def get_liked_movies(user_id: str, request: Request):
# #     db = request.app.state.movie_db
# #     user = await db.users.find_one({"userId": user_id})

# #     if not user:
# #         raise HTTPException(status_code=404, detail="User not found")

# #     liked_ids = user.get("liked", [])
# #     movies = await db.hybridRecommendation.find({"_id": {"$in": [ObjectId(mid) for mid in liked_ids]}}).to_list(100)

# #     for movie in movies:
# #         movie["_id"] = str(movie["_id"])

# #     return movies


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