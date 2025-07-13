import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from tqdm import tqdm
from pymongo.errors import BulkWriteError

# Load environment variables
load_dotenv(dotenv_path=r"C:\Users\ufair\OneDrive\Documents\GitHub\Video_Recommendation_FYP\server\.env")

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not found. Please check your .env file.")

# Load Version 2 dataset
# csv_path = r"C:\Users\ufair\OneDrive\Desktop\venv\hybrid_recommendations2Edited.csv" 
csv_path = r"C:\Users\ufair\OneDrive\Desktop\venv\hybrid_recommendations_final.csv"
df = pd.read_csv(csv_path)
data = df.to_dict(orient="records")

# MongoDB database and collection
client = MongoClient(MONGO_URI)
db = client["NewMovieDatabase"]  
collection = db["hybridRecommendation2"]

collection.delete_many({})

# Batch insert setup
batch_size = 1000
print(f" Inserting {len(data)} documents into NewMovieDatabase.hybridRecommendation (v2) in batches of {batch_size}...")

for i in tqdm(range(0, len(data), batch_size), desc="Uploading", unit="batch"):
    batch = data[i:i+batch_size]
    try:
        collection.insert_many(batch, ordered=False)
    except BulkWriteError as bwe:
        print(f" BulkWriteError at batch {i//batch_size}: {bwe.details}")

print("Version 2 upload complete.")
