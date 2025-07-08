# import math
# from typing import List
# from fastapi import APIRouter, Request, HTTPException, Body
# from fastapi.responses import JSONResponse

# router = APIRouter()

# #  GET /api/movies/all — fetch all movies
# @router.get("/all")
# def get_all_movies(request: Request):
#     db = request.app.state.movie_db
#     try:
#         movies = list(db.hybridRecommendation2.find().limit(50000))  # use correct collection

#         for movie in movies:
#             movie["_id"] = str(movie["_id"])  # convert ObjectId to string
#             for key, value in movie.items():
#                 if isinstance(value, float) and math.isnan(value):
#                     movie[key] = None  # replace NaN with None

#         return JSONResponse(content=movies)

#     except Exception as e:
#         print("❌ Failed to fetch movies:", e)
#         raise HTTPException(status_code=500, detail="Failed to fetch movies")

# @router.post("/regenerate")
# def regenerate_movies(request: Request, body: dict = Body(...)):
#     db = request.app.state.movie_db
#     genres: List[str] = body.get("genres", [])
#     exclude_titles: List[str] = body.get("excludeTitles", [])

#     try:
#         # Normalize genres
#         normalized_genres = [g.lower().strip() for g in genres]

#         # Initial query to exclude unwanted titles and ensure valid poster/trailer
#         base_query = {
#             "title": {"$nin": exclude_titles},
#             "poster_url": {"$ne": None},
#             "trailer_url": {"$ne": None},
#             "genres": {"$exists": True}
#         }

#         # Fetch all potential matches
#         cursor = db.hybridRecommendation2.find(base_query)

#         seen = set()
#         unique_movies = []

#         for movie in cursor:
#             raw_genres = movie.get("genres", [])
#             if isinstance(raw_genres, str):
#                 raw_genres = [g.strip().lower() for g in raw_genres.split(",")]
#             elif isinstance(raw_genres, list):
#                 raw_genres = [g.strip().lower() for g in raw_genres]
#             else:
#                 raw_genres = []

#             if any(g in normalized_genres for g in raw_genres):
#                 title = movie.get("title")
#                 if not title or title in seen:
#                     continue
#                 seen.add(title)

#                 movie["_id"] = str(movie["_id"])
#                 for key, value in movie.items():
#                     if isinstance(value, float) and math.isnan(value):
#                         movie[key] = None
#                 unique_movies.append(movie)

#         return JSONResponse(content=unique_movies)

#     except Exception as e:
#         print("❌ Failed to regenerate movies:", e)
#         raise HTTPException(status_code=500, detail="Failed to regenerate movies")

import math
from typing import List
from fastapi import APIRouter, Request, HTTPException, Body
from fastapi.responses import JSONResponse
from bson import ObjectId

router = APIRouter()

#  GET /api/movies/all — fetch all movies
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
