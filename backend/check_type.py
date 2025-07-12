from pymongo import MongoClient

# ✅ Use the correct connection URI (direct connection to NewMovieDatabase)
MOVIE_DB_URI = "mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net/NewMovieDatabase?retryWrites=true&w=majority"

# Connect to MongoDB
client = MongoClient(MOVIE_DB_URI)
db = client["NewMovieDatabase"]
collection = db["hybridRecommendation2"]

# Get one document and check movieId type
doc = collection.find_one()
if doc:
    movie_id = doc.get("movieId")
    print("🎬 movieId:", movie_id)
    print("📌 Type of movieId:", type(movie_id))
else:
    print("⚠️ No documents found in 'hybridRecommendation2' collection.")


# from pymongo import MongoClient
# from tqdm import tqdm  # <-- Install if needed: pip install tqdm

# # MongoDB connection
# MOVIE_DB_URI = "mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net/NewMovieDatabase?retryWrites=true&w=majority"
# client = MongoClient(MOVIE_DB_URI)
# db = client["NewMovieDatabase"]
# collection = db["hybridRecommendation2"]

# # Count total documents for progress bar
# total_docs = collection.count_documents({})

# Type counters
# type_counts = {}

# # Loop with progress bar
# for doc in tqdm(collection.find({}, {"movieId": 1}), total=total_docs, desc="Checking movieId types"):
#     if "movieId" not in doc:
#         key = "missing"
#     elif doc["movieId"] is None:
#         key = "null"
#     else:
#         key = type(doc["movieId"]).__name__

#     type_counts[key] = type_counts.get(key, 0) + 1

# # Show results
# print("\n📊 movieId type breakdown:")
# for t, count in type_counts.items():
#     print(f"{t}: {count}")


# from pymongo import MongoClient
# from tqdm import tqdm  # Progress bar

# # MongoDB connection
# MOVIE_DB_URI = "mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net/NewMovieDatabase?retryWrites=true&w=majority"
# client = MongoClient(MOVIE_DB_URI)
# db = client["NewMovieDatabase"]
# collection = db["hybridRecommendation2"]

# # Count how many need updating (int type)
# total_to_update = collection.count_documents({ "movieId": { "$type": "int" } })

# # Confirm total
# print(f"🔍 Found {total_to_update} documents with int movieId")

# # Update with progress bar
# updated = 0
# cursor = collection.find({ "movieId": { "$type": "int" } }, { "_id": 1, "movieId": 1 })

# for doc in tqdm(cursor, total=total_to_update, desc="🔁 Converting movieId to string"):
#     int_id = doc["movieId"]
#     collection.update_one(
#         { "_id": doc["_id"] },
#         { "$set": { "movieId": str(int_id) } }
#     )
#     updated += 1

# # ✅ Done
# print(f"\n✅ Finished: Updated {updated} movieId values from int to string.")



# from pymongo import MongoClient

# # Connect to MongoDB
# MOVIE_DB_URI = "mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net/NewMovieDatabase?retryWrites=true&w=majority"
# client = MongoClient(MOVIE_DB_URI)
# db = client["NewMovieDatabase"]
# collection = db["hybridRecommendation2"]

# # Count documents where movieId is still an integer
# remaining_ints = collection.count_documents({ "movieId": { "$type": "int" } })

# print(f"🔎 Remaining documents with movieId as int: {remaining_ints}")


# from pymongo import MongoClient, UpdateOne
# from tqdm import tqdm

# # === 1. MongoDB Connection ===
# MOVIE_DB_URI = "mongodb+srv://claraxin:fyp2025@moviecluster.t4qlmfx.mongodb.net/NewMovieDatabase?retryWrites=true&w=majority"
# client = MongoClient(MOVIE_DB_URI)
# db = client["NewMovieDatabase"]
# collection = db["hybridRecommendation2"]

# # === 2. Count how many documents need to be updated ===
# total_to_update = collection.count_documents({ "movieId": { "$type": "int" } })
# print(f"🔍 Found {total_to_update} documents with movieId as int")

# # === 3. Optional: Create index on movieId (skip if already exists) ===
# collection.create_index("movieId")

# # === 4. Find only documents with int movieId and get _id + movieId fields ===
# cursor = collection.find({ "movieId": { "$type": "int" } }, { "_id": 1, "movieId": 1 })

# # === 5. Prepare for batched updates ===
# batch_size = 1000
# operations = []
# updated_count = 0

# # === 6. Process with progress bar ===
# for doc in tqdm(cursor, total=total_to_update, desc="🔁 Converting movieId to string"):
#     int_id = doc["movieId"]
#     operations.append(
#         UpdateOne({ "_id": doc["_id"] }, { "$set": { "movieId": str(int_id) } })
#     )

#     # When batch is full, write to DB
#     if len(operations) == batch_size:
#         result = collection.bulk_write(operations)
#         updated_count += result.modified_count
#         operations = []

# # === 7. Write any remaining documents ===
# if operations:
#     result = collection.bulk_write(operations)
#     updated_count += result.modified_count

# # === 8. Done! ===
# print(f"✅ Finished converting movieId for {updated_count} documents.")

