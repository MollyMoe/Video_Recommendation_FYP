# movieDb.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MOVIE_DB_URI = os.getenv("MOVIE_DB_URI")
movie_client = MongoClient(MOVIE_DB_URI)
movie_db = movie_client["NewMovieDatabase"]

liked_collection = movie_db["liked"]
saved_collection = movie_db["saved"]
history_collection = movie_db["history"]
