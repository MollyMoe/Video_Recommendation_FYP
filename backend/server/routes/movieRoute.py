# import math
# from fastapi import APIRouter, Request, HTTPException
# from fastapi.responses import JSONResponse

# router = APIRouter()

# @router.get("/all")
# def get_all_movies(request: Request):
#     db = request.app.state.movie_db
#     try:
#         # Fetch from your actual collection
#         # movies = list(db.hybridRecommendation.find().limit(25000))

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


import math
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/recommendations")
async def get_recommendations(userId: str, request: Request):
    try:
        user_db = request.app.state.user_db
        movie_db = request.app.state.movie_db

        # 1. Fetch the user and genres
        user = user_db["streamer"].find_one({"userId": userId})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        preferred_genres = user.get("genres", [])
        if not preferred_genres:
            return JSONResponse(content=[])

        # 2. Fetch all movies (we’ll filter manually in Python)
        all_movies = list(movie_db["hybridRecommendation2"].find())
        filtered_movies = []

        for movie in all_movies:
            # Normalize genres field
            raw_genres = movie.get("genres", "")
            genres = (
                [g.strip() for g in raw_genres.split("|")]
                if isinstance(raw_genres, str)
                else raw_genres
            )

            # Match preferred genres
            if any(g in genres for g in preferred_genres):
                movie["_id"] = str(movie["_id"])
                movie["genres"] = genres

                # Normalize other fields
                movie["actors"] = (
                    [a.strip() for a in movie.get("actors", "").split(",")]
                    if isinstance(movie.get("actors"), str)
                    else movie.get("actors", [])
                )
                movie["producers"] = (
                    [p.strip() for p in movie.get("producers", "").split(",")]
                    if isinstance(movie.get("producers"), str)
                    else movie.get("producers", [])
                )
                movie["director"] = movie.get("director", "N/A").strip()
                movie["overview"] = movie.get("overview", "N/A").strip()

                filtered_movies.append(movie)

        return JSONResponse(content=filtered_movies)

    except Exception as e:
        print("❌ Failed to fetch recommendations:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")


@router.get("/debug-movies")
def get_debug_movies(request: Request):
    try:
        sample = list(
            request.app.state.movie_db["hybridRecommendation2"]
            .find({"userId": 833})
            .limit(3)
        )
        for m in sample:
            m["_id"] = str(m["_id"])
        return sample
    except Exception as e:
        print("❌ Debug error:", e)
        raise HTTPException(status_code=500, detail="Debug route failed")

