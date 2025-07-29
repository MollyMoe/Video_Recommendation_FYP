import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from tqdm import tqdm
from pymongo.errors import BulkWriteError

# Load environment variables from .env
load_dotenv(dotenv_path=r"C:\Users\ufair\OneDrive\Documents\GitHub\Video_Recommendation_FYP\server\.env")

# Get MongoDB URI from environment variable
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not found. Please check your .env file.")

# CSV file path for Added1.csv
csv_path = r"C:\Users\ufair\OneDrive\Desktop\venv\Added3.csv"

# Load CSV into DataFrame
df = pd.read_csv(csv_path)
data = df.to_dict(orient="records")

# MongoDB client, database, and collection
client = MongoClient(MONGO_URI)
db = client["NewMovieDatabase"]
collection = db["added"]


# Batch insert setup
batch_size = 1000
print(f"\nInserting {len(data)} documents into NewMovieDatabase.added in batches of {batch_size}...")

# Upload in batches
for i in tqdm(range(0, len(data), batch_size), desc="Uploading", unit="batch"):
    batch = data[i:i+batch_size]
    try:
        collection.insert_many(batch, ordered=False)
    except BulkWriteError as bwe:
        print(f"\nBulkWriteError at batch {i//batch_size}: {bwe.details}")

print("✅ Upload complete.")
