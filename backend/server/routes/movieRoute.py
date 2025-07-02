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