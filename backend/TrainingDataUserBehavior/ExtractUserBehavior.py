# from pymongo import MongoClient
# from dotenv import load_dotenv
# import os
# import json

# def extract_user_behavior(output_file="user_behavior.json"):
#     load_dotenv()
#     client = MongoClient(os.getenv("MONGO_URI"))

#     # Connect to DBs and collections
#     new_db = client['NewMovieDatabase']
#     liked = new_db['liked']
#     saved = new_db['saved']
#     history = new_db['history']
#     users = client['users']['streamer']

#     # Build userId → genres map
#     user_genre_map = {}
#     for user in users.find():
#         userId = user.get("userId")
#         genres = user.get("genres", [])
        
#         if isinstance(genres, str):
#             genres = [g.strip().lower() for g in genres.split(",")]
#         elif isinstance(genres, list):
#             genres = [g.strip().lower() for g in genres]
#         else:
#             genres = []

#         if userId:
#             user_genre_map[userId] = genres

#     # Extract user interactions
#     data = []
#     for collection, weight in [(liked, 5), (saved, 4), (history, 3)]:
#         key = (
#             "likedMovies" if collection == liked
#             else "savedMovies" if collection == saved
#             else "historyMovies"
#         )

#         for doc in collection.find():
#             userId = doc.get("userId")
#             movie_ids = doc.get(key, [])
#             for movie_id in movie_ids:
#                 if isinstance(movie_id, dict):
#                     movie_id = movie_id.get("movieId")
#                 if userId and movie_id:
#                     data.append({
#                         "userId": userId,
#                         "movieId": movie_id,
#                         "rating": weight,
#                         "genres": user_genre_map.get(userId, [])
#                     })

#     print(f"✅ Extracted {len(data)} user-movie interactions")

#     # Write to JSON lines file
#     with open(output_file, "w") as f:
#         for entry in data:
#             f.write(json.dumps(entry) + "\n")

#     print(f"✅ Written to {output_file}")

# if __name__ == "__main__":
#     extract_user_behavior()

from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json

def extract_user_behavior(output_file="user_behavior.json"):
    load_dotenv()
    client = MongoClient(os.getenv("MONGO_URI"))

    # Connect to DBs and collections
    new_db = client['NewMovieDatabase']
    liked = new_db['liked']
    saved = new_db['saved']
    history = new_db['history']
    movie_meta = new_db['hybridRecommendation2']  # For looking up genres

    # Prepare data
    data = []
    for collection, weight in [(liked, 5), (saved, 4), (history, 3)]:
        key = "likedMovies" if collection == liked else "SaveMovies" if collection == saved else "historyMovies"
        for doc in collection.find():
            userId = doc.get("userId")
            movie_ids = doc.get(key, [])
            for movie_id in movie_ids:
                if isinstance(movie_id, dict):
                    movie_id = movie_id.get("movieId")
                if not userId or not movie_id:
                    continue

                # Look up movie genres from hybridRecommendation2
                movie_doc = movie_meta.find_one({"movieId": str(movie_id)}, {"genres": 1})
                genres = movie_doc.get("genres", []) if movie_doc else []

                data.append({
                    "userId": userId,
                    "movieId": str(movie_id),
                    "rating": weight,
                    "titlegenres": genres
                })

    print(f"✅ Extracted {len(data)} interactions")

    # Write to file
    with open(output_file, "w") as f:
        for entry in data:
            f.write(json.dumps(entry) + "\n")

    print(f"✅ Written to {output_file}")

if __name__ == "__main__":
    extract_user_behavior()

