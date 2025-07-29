import math
from typing import List
from fastapi import APIRouter, Request, Query, HTTPException, Body
from fastapi.responses import JSONResponse
from bson import ObjectId, errors
from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime
import uuid 

class Movie(BaseModel):
    _id: Optional[str]
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
    createdAt: Optional[datetime] = None
    lastSyncedBatchId: Optional[str] = None 

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
        movies = list(db.hybridRecommendation2.find().limit(25000))

        for movie in movies:
            movie["_id"] = str(movie["_id"])
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
    movie_id = data.get("movieId")

    if not user_id or not movie_id:
        raise HTTPException(status_code=400, detail="Missing userId or movieId")

    liked_collection.update_one(
        {"userId": user_id},
        {"$addToSet": {"likedMovies": movie_id}},
        upsert=True
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

    liked_ids = liked_doc["likedMovies"]

    movies_cursor = movies_collection.find(
        {"movieId": {"$in": liked_ids}},
        {"_id": 1, "movieId": 1, "poster_url": 1, "title": 1, "trailer_url": 1 }
    )

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
        history_collection.update_one(
            {"userId": user_id},
            {"$pull": {"historyMovies": movie_id}}
        )

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
            #{"$limit": 30}
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

@router.get("/search")
def search_movies(request: Request, q: str = Query(..., min_length=1)):
    db = request.app.state.movie_db
    try:
        results = db.hybridRecommendation2.find({
            "$text": { "$search": f'"{q}"' }, 
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
        print("❌ Backend Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/limit")
def get_movies(request: Request, page: int = 1, limit: int = 20, search: str = ""):
    db = request.app.state.movie_db
    skip = (page - 1) * limit

    query = {}
    if search:
        query = {
            "$or": [
                {"title": {"$regex": search, "$options": "i"}},
                {"director": {"$regex": search, "$options": "i"}}
            ]
        }

    try:
        cursor = db.hybridRecommendation2.find(query, {"_id": 1, "title": 1, "poster_url": 1, "director": 1})
        total = db.hybridRecommendation2.count_documents(query)
        movies = list(cursor.skip(skip).limit(limit))

        for movie in movies:
            movie["_id"] = str(movie["_id"])

        return {"data": movies, "total": total, "page": page}
    except Exception as e:
        print("❌ Error:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch movies")
    

# Move movies from 'added' collection to 'hybridRecommendation2', replace existing movies with the same title.    
@router.post("/sync-added-movies")
async def sync_added_movies(request: Request):
    db = request.app.state.movie_db
    added_collection = db["added"]
    hybrid_collection = db["hybridRecommendation2"]
    sync_metadata_collection = db["sync_metadata"] # Collection to store sync metadata

    try:
        new_movies_from_added = list(added_collection.find({}))

        if not new_movies_from_added:
            return {"message": "No new movies found.", "newly_added_movies": []}

        # Generate a unique batch ID for this sync operation
        current_batch_id = str(uuid.uuid4()) # Generate a UUID for the batch

        # Clear the lastSyncedBatchId from ALL existing movies in hybridRecommendation2
        # This ensures only the current batch will have the marker.
        hybrid_collection.update_many(
            {"lastSyncedBatchId": {"$ne": None}}, # Find documents that have a batch ID
            {"$unset": {"lastSyncedBatchId": ""}} # Remove the field
        )
        print("🧹 Cleared lastSyncedBatchId from previous batches in hybridRecommendation2.")


        new_movie_titles = [movie.get("title") for movie in new_movies_from_added if movie.get("title")]

        deleted_count = 0
        if new_movie_titles:
            delete_result = hybrid_collection.delete_many(
                {"title": {"$in": new_movie_titles}}
            )
            deleted_count = delete_result.deleted_count
            print(f"🗑️ Deleted {deleted_count} existing movies matching new titles.")

        movies_to_insert = []
        for movie in new_movies_from_added:
            movie.pop("_id", None) 
            if isinstance(movie.get("genres"), str):
                movie["genres"] = [g.strip() for g in movie["genres"].split(',') if g.strip()]
            
            movie["createdAt"] = datetime.utcnow() 
            movie["lastSyncedBatchId"] = current_batch_id # Add the current batch ID to new movies
            movies_to_insert.append(movie)

        inserted_ids = []
        if movies_to_insert:
            insert_result = hybrid_collection.insert_many(movies_to_insert)
            inserted_ids = insert_result.inserted_ids
            print(f"➕ Inserted {len(inserted_ids)} new movies.")

        # Store the current_batch_id as the latest successful sync ID
        sync_metadata_collection.update_one(
            {"_id": "latest_sync_info"}, # Use a fixed _id for a single metadata document
            {"$set": {"last_successful_sync_batch_id": current_batch_id, "timestamp": datetime.utcnow()}},
            upsert=True
        )
        print(f"📝 Updated latest sync batch ID to: {current_batch_id}")


        newly_added_movies_details = []
        if inserted_ids:
            newly_added_movies_details = list(hybrid_collection.find(
                {"_id": {"$in": inserted_ids}},
                {"_id": 1, "movieId": 1, "title": 1, "poster_url": 1} 
            ))
            for movie in newly_added_movies_details:
                movie["_id"] = str(movie["_id"])

        added_collection.delete_many({})
        print("🧹 'added' collection cleared after sync.")

        final_message_parts = []
        if inserted_ids:
            final_message_parts.append(f"Added {len(inserted_ids)} new movies.")
        if deleted_count > 0:
            final_message_parts.append(f"Replaced {deleted_count} existing movies.")
        
        if not inserted_ids and deleted_count > 0:
            final_message_parts.append(f"Deleted {deleted_count} movies.")

        final_message = ". ".join(final_message_parts) if final_message_parts else "No changes applied."
        if not new_movies_from_added:
             final_message = "No new movies found."


        return {
            "message": final_message,
            "deleted_count": deleted_count,
            "inserted_count": len(inserted_ids),
            "newly_added_movies": newly_added_movies_details
        }

    except Exception as e:
        print(f"❌ Error syncing movies: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync movies: {e}")

# Endpoint to get the latest successful sync batch ID
@router.get("/latest-sync-batch-id")
def get_latest_sync_batch_id(request: Request):
    db = request.app.state.movie_db
    sync_metadata_collection = db["sync_metadata"]
    try:
        metadata = sync_metadata_collection.find_one({"_id": "latest_sync_info"})
        latest_batch_id = metadata.get("last_successful_sync_batch_id") if metadata else None
        print(f"DEBUG: Latest sync batch ID requested: {latest_batch_id}")
        return {"latest_batch_id": latest_batch_id}
    except Exception as e:
        print(f"❌ Error fetching latest sync batch ID: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch latest sync batch ID")


# Modified endpoint to get persistently recently added movies (by batch ID)
@router.get("/recently-added-persistent")
def get_recently_added_persistent_movies(request: Request, batch_id: Optional[str] = None):
    db = request.app.state.movie_db
    try:
        # If no batch_id is provided in the query, try to get the latest one from metadata
        if not batch_id:
            metadata = db["sync_metadata"].find_one({"_id": "latest_sync_info"})
            if metadata and metadata.get("last_successful_sync_batch_id"):
                batch_id = metadata["last_successful_sync_batch_id"]
            else:
                # If no batch_id provided and no latest batch ID found, return empty
                print("DEBUG: No batch_id provided and no latest sync batch ID found in metadata.")
                return JSONResponse(content=[])

        # Now, query using the determined batch_id
        query = {"lastSyncedBatchId": batch_id}

        movies_cursor = db.hybridRecommendation2.find(
            query, 
            {"_id": 1, "movieId": 1, "title": 1, "poster_url": 1, "createdAt": 1, "lastSyncedBatchId": 1} 
        ).sort("createdAt", -1) # Sort by createdAt within the batch

        movies = []
        for movie in movies_cursor:
            movie["_id"] = str(movie["_id"])
            if "createdAt" in movie and isinstance(movie["createdAt"], datetime):
                movie["createdAt"] = movie["createdAt"].isoformat()
            movies.append(movie)
        
        print(f"DEBUG: Recently added persistent movies returned for batch_id '{batch_id}':", movies) 
        return JSONResponse(content=movies)
    except Exception as e:
        print("❌ Error fetching recently added persistent movies:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch recently added movies")
