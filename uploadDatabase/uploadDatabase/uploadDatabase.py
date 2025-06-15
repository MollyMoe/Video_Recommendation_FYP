import pandas as pd
from pymongo import MongoClient
from tqdm import tqdm
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=r"C:\Users\ufair\OneDrive\Documents\GitHub\Video_Recommendation_FYP\server\.env")

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not found. Please check your .env file.")

df = pd.read_csv(r"C:\Users\ufair\OneDrive\Desktop\venv\hybrid_recommendations.csv")

client = MongoClient(MONGO_URI)
db = client["MovieDatabase"]
collection = db["hybridRecommendation"]

collection.delete_many({})

print(f"Uploading {len(df)} documents to MongoDB Atlas...")
for record in tqdm(df.to_dict(orient="records"), total=len(df), desc="Progress", unit="doc"):
    collection.insert_one(record)

print("Upload complete.")
