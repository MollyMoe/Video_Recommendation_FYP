import math
from typing import List
from fastapi import APIRouter, Request, HTTPException, Body, Query
from fastapi.responses import JSONResponse
from bson import ObjectId, errors
from pydantic import BaseModel
from typing import Optional, List, Union
from collections import Counter #added

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
    liked_collection.update_one(
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
        {"_id": 1, "movieId": 1, "poster_url": 1, "title": 1, "trailer_url": 1 }
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


@router.post("/history")
async def add_to_history(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    history_collection = db["history"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    

    if not user_id or movie_id is None:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    movie_id = str(movie_id) 
    
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

        history_ids = [str(mid) for mid in history_doc["historyMovies"]]


        movies_cursor = movies_collection.find(
            {"movieId": {"$in": history_ids}},
            {"_id": 1, "movieId": 1, "poster_url": 1, "title": 1, "trailer_url": 1 }
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

    movie_id = str(movie_id) 

    # Use $addToSet to avoid duplicate entries in history
    watchLater_collection.update_one(
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

        saveMovie_ids = [str(mid) for mid in save["SaveMovies"]]

        movies_cursor = movies_collection.find(
            {"movieId": {"$in": saveMovie_ids}},
            {"_id": 1, "movieId": 1, "poster_url": 1, "title": 1, "trailer_url": 1 }
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
    

@router.post("/likedMovies/delete")
async def remove_from_liked_movies(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    liked_collection = db["liked"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or movie_id is None:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    try:
        movie_id = int(movie_id)
    except (ValueError, TypeError):
        pass

    movie_id = str(data.get("movieId"))

    result = liked_collection.update_one(
        {"userId": user_id},
        {"$pull": {"likedMovies": movie_id}}
    )

    print("💥 MongoDB modified count:", result.modified_count)


    if result.modified_count > 0:
        return {"message": "Movie removed from liked list"}
    else:
        return {"message": "Movie not found or already removed"}



@router.post("/watchLater/delete")
async def remove_from_watchLater(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    watchLater_collection = db["saved"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or movie_id is None:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    movie_id = str(movie_id)

    result = watchLater_collection.update_one(
        {"userId": user_id},
        {"$pull": {"SaveMovies": movie_id}}
    )

    print("💥 WatchLater delete modified count:", result.modified_count)

    if result.modified_count > 0:
        return {"message": "Movie removed from watch later list"}
    else:
        return {"message": "Movie not found or already removed"}
    

@router.post("/historyMovies/delete")
async def remove_from_history(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    history_collection = db["history"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or movie_id is None:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    movie_id = str(movie_id)

    result = history_collection.update_one(
        {"userId": user_id},
        {"$pull": {"historyMovies": movie_id}}
    )

    print("🧹 Removed from history:", result.modified_count)

    if result.modified_count > 0:
        return {"message": "Movie removed from history"}
    else:
        return {"message": "Movie not found or already removed"}
    
    
    
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
#             {"$replaceRoot": {"newRoot": "$doc"}}
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
        
#     raise HTTPException(status_code=500, detail="Failed to regenerate movies")

@router.post("/regenerate")
def regenerate_movies(request: Request, body: dict = Body(...)):
    db = request.app.state.movie_db
    genres: List[str] = [g.lower().strip() for g in body.get("genres", [])]
    exclude_titles: List[str] = body.get("excludeTitles", [])

    try:
        movies_cursor = db.hybridRecommendation2.find({
            "title": {"$nin": exclude_titles},
            "poster_url": {"$ne": None},
            "trailer_url": {"$ne": None}
        })

        matched_movies = []

        for movie in movies_cursor:
            raw_genres = movie.get("genres", [])
            if isinstance(raw_genres, str):
                movie_genres = [g.strip().lower() for g in raw_genres.split("|") + raw_genres.split(",")]
            elif isinstance(raw_genres, list):
                movie_genres = [g.strip().lower() for g in raw_genres]
            else:
                continue

            if any(g in movie_genres for g in genres):
                movie["_id"] = str(movie["_id"])
                for key, value in movie.items():
                    if isinstance(value, float) and math.isnan(value):
                        movie[key] = None
                matched_movies.append(movie)

        return JSONResponse(content=matched_movies)

    except Exception as e:
        print("❌ Failed to regenerate movies:", e)
        raise HTTPException(status_code=500, detail="Failed to regenerate movies")


# # store recommendations in a collection
# @router.post("/store-recommendations")
# async def store_recommendations(
#     request: Request,
#     payload: dict = Body(...)
# ):
#     db = request.app.state.movie_db
#     user_id = payload.get("userId")
#     movies = payload.get("movies", [])

#     if not user_id or not isinstance(movies, list):
#         return JSONResponse(status_code=400, content={"error": "Invalid request"})

#     try:
#         db.recommended.update_one(
#             { "userId": user_id },
#             { "$set": { "recommended": movies } },
#             upsert=True
#         )
#         return { "message": "Recommendations saved to 'recommended' collection." }
#     except Exception as e:
#         print("❌ Error saving recommendations:", e)
#         return JSONResponse(status_code=500, content={"error": "Failed to save recommendations"})

@router.post("/store-recommendations")
async def store_recommendations(request: Request, payload: dict = Body(...)):
    try:
        db = request.app.state.movie_db
        user_id = payload.get("userId")
        movies = payload.get("movies", [])

        if not isinstance(movies, list) or not movies:
            return {"message": "No movies to store — skipping insert."}

        #  Clean up each movie
        for movie in movies:
            movie.pop("_id", None)
            movie["userId"] = user_id

        # Remove existing recommendations for that user
        db.recommended.delete_many({"userId": user_id})

        # ✅ Insert each movie as its own document
        db.recommended.insert_many(movies)

        return {"message": "Recommendations saved as individual documents."}

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ Failed to store recommendations:", str(e))
        return JSONResponse(status_code=500, content={"error": "Internal Server Error"})



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

@router.get("/search")
def search_movies(request: Request, q: str = Query(..., min_length=1)):
    db = request.app.state.movie_db
    try:
        results = db.hybridRecommendation2.find({
            "$text": { "$search": f"{q}" },
            "poster_url": { "$nin": ["", None, "nan", "NaN"] },
            "trailer_url": { "$nin": ["", None, "nan", "NaN"] }
            })

        movies = []
        for movie in results:
            movie["_id"] = str(movie["_id"])
            for key, value in movie.items():
                if isinstance(value, float) and math.isnan(value):
                    movie[key] = None
            movies.append(movie)

        return JSONResponse(content=movies)
    except Exception as e:
        print("❌ Search failed:", e)
        raise HTTPException(status_code=500, detail="Search failed")

@router.post("/historyMovies/removeAllHistory")
async def remove_history(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    history_collection = db["history"]

    user_id = data.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing userId")

    try:
        result = history_collection.update_one(
            {"userId": user_id},
            {"$set": {"historyMovies": []}}
        )

        print("🧹 Cleared history count:", result.modified_count)

        return {"message": "History cleared"}
    except Exception as e:
        print("❌ Failed to clear history:", e)
        raise HTTPException(status_code=500, detail="Server error")
    
# delete from recommendation
@router.post("/recommended/delete")
async def remove_from_recommended(request: Request):
    data = await request.json()
    db = request.app.state.movie_db
    recommended_collection = db["recommended"]

    user_id = data.get("userId")
    movie_id = data.get("movieId")

    if not user_id or not movie_id:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    # Pull from array of objects where movieId matches
    result = recommended_collection.update_one(
        {"userId": user_id},
        {"$pull": { "recommended": { "movieId": str(movie_id) } }}
    )

    print("🗑️ Removed from recommendations:", result.modified_count)

    if result.modified_count > 0:
        return {"message": "Movie removed from recommendations"}
    else:
        return {"message": "Movie not found or already removed"}



# new for the because you like/save/watch
@router.post("/als-liked")
async def als_liked(request: Request):
    body = await request.json()
    return _als_filtered(body["userId"], "liked", request, set(body.get("excludeIds", [])))

@router.post("/als-saved")
async def als_saved(request: Request):
    body = await request.json()
    return _als_filtered(body["userId"], "saved", request, set(body.get("excludeIds", [])))

@router.post("/als-watched")
async def als_watched(request: Request):
    body = await request.json()
    return _als_filtered(body["userId"], "history", request, set(body.get("excludeIds", [])))


def _als_filtered(userId: str, interaction_collection: str, request: Request, exclude_ids=None):
    db = request.app.state.movie_db
    als = db["alsRecommendations"]
    movies = db["hybridRecommendation2"]
    interactions = db[interaction_collection]

    if exclude_ids is None:
        exclude_ids = set()
    else:
        exclude_ids = set(str(mid) for mid in exclude_ids)

    try:
        interaction_doc = interactions.find_one({"userId": userId})
        if not interaction_doc:
            print("⚠️ No interaction doc found.")
            return JSONResponse(content=[])

        if interaction_collection == "liked":
            interaction_ids = [str(mid.get("movieId") if isinstance(mid, dict) else mid)
                               for mid in interaction_doc.get("likedMovies", [])]
        elif interaction_collection == "saved":
            interaction_ids = [str(mid.get("movieId") if isinstance(mid, dict) else mid)
                               for mid in interaction_doc.get("SaveMovies", [])]
        elif interaction_collection == "history":
            interaction_ids = [str(mid.get("movieId") if isinstance(mid, dict) else mid)
                               for mid in interaction_doc.get("historyMovies", [])]
        else:
            return JSONResponse(content=[])


        # Step 1: Fetch genres
        genre_set = set()
        for mid in interaction_ids:
            movie = movies.find_one({"movieId": str(mid)}, {"genres": 1})
            if movie:
                genres = movie.get("genres", [])
                if isinstance(genres, str):
                    genre_set.update(g.strip().lower() for g in genres.split("|"))
                elif isinstance(genres, list):
                    genre_set.update(g.strip().lower() for g in genres)

        # Step 2: Get ALS recommendations
        als_results = [
                {**rec, "movieId": str(rec["movieId"])} 
                for rec in als.find({"userId": userId}).sort("rating", -1)
            ]

        if not als_results:
            return JSONResponse(content=[])

        interaction_ids_set = set(interaction_ids)
        candidate_ids = [
            rec["movieId"]
            for rec in als_results
            if str(rec["movieId"]) not in interaction_ids_set
            and str(rec["movieId"]) not in exclude_ids
        ]


        if not candidate_ids:
            return JSONResponse(content=[])

        # Step 4: Fetch metadata
        movie_cursor = movies.find({
            "movieId": {"$in": candidate_ids}
        }, {
            "_id": 1, "movieId": 1, "title": 1, "poster_url": 1, "trailer_url": 1,
            "genres": 1, "overview": 1, "actors": 1, "producers": 1, "director": 1,
            "predicted_rating": 1
        })

        # Step 5: Filter by genre match
        final_movies = []
        for movie in movie_cursor:
            raw_genres = movie.get("genres", [])
            if isinstance(raw_genres, str):
                movie_genres = set(g.strip().lower() for g in raw_genres.split("|"))
            elif isinstance(raw_genres, list):
                movie_genres = set(g.strip().lower() for g in raw_genres)
            else:
                movie_genres = set()

            # TEMP: Show all if genre_set is empty
            if not genre_set or genre_set & movie_genres:
                movie["_id"] = str(movie["_id"])
                final_movies.append(movie)

            if len(final_movies) >= 12:
                break

        return JSONResponse(content=final_movies)

    except Exception as e:
        print(f"❌ ALS-{interaction_collection} fetch failed:", e)
        raise HTTPException(status_code=500, detail="Internal server error")


# GET /api/movies/counts/:userId
@router.get("/counts/{userId}")
def get_user_counts(userId: str, request: Request):
    try:
        print(f"🔍 Fetching counts for userId: {userId}")
        db = request.app.state.movie_db

        liked_doc = db["liked"].find_one({"userId": userId})
        saved_doc = db["saved"].find_one({"userId": userId})
        watched_doc = db["history"].find_one({"userId": userId})

        liked_count = len(liked_doc.get("likedMovies", [])) if liked_doc else 0
        saved_count = len(saved_doc.get("SaveMovies", [])) if saved_doc else 0
        watched_count = len(watched_doc.get("historyMovies", [])) if watched_doc else 0

        print(f"👍 liked count: {liked_count}")
        print(f"💾 saved count: {saved_count}")
        print(f"👀 watched count: {watched_count}")

        return JSONResponse(content={
            "liked": liked_count,
            "saved": saved_count,
            "watched": watched_count
        })

    except Exception as e:
        print("❌ Error fetching interaction counts:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch counts")


## for top likes
@router.get("/top-liked")
async def get_top_liked_movies(request: Request):
    db = request.app.state.movie_db
    liked_collection = db["liked"]

    try:
        pipeline = [
            { "$unwind": "$likedMovies" },
            { "$group": { "_id": "$likedMovies", "likeCount": { "$sum": 1 } } },
            { "$sort": { "likeCount": -1 } },
            { "$limit": 10 }
        ]
        liked_result = list(liked_collection.aggregate(pipeline))

        movie_ids = [m["_id"] for m in liked_result]

        movie_docs = list(db["hybridRecommendation2"].find({ "movieId": { "$in": movie_ids } }))

        movie_dict = {str(movie["movieId"]): movie for movie in movie_docs}

        response = []
        for movie in liked_result:
            movie_id_str = str(movie["_id"])
            details = movie_dict.get(movie_id_str, None)
            if details and "_id" in details:
                del details["_id"]

            response.append({
                "movieId": movie_id_str,
                "likeCount": movie["likeCount"],
                "details": details
            })

        return response

    except Exception as e:
        print(" Backend Error:", e)
        raise HTTPException(status_code=500, detail=str(e))