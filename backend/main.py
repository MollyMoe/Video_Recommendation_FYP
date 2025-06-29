from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
from server.routes.auth import router as auth_router
from server.routes.genreRoute import router as genre_router
from server.routes.movieRoute import router as movie_router
from server.routes.passwordRoute import router as password_router
from server.routes.editProfileRoute import router as edit_router
from server.routes.profileRoute import router as profile_router
from fastapi.staticfiles import StaticFiles

# Load .env from ../server/.en
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Load environment variables
USER_DB_URI = os.getenv("MONGO_URI")
print("Connecting to Mongo URI:", USER_DB_URI)
print("MONGO_URI loaded:", os.getenv("MONGO_URI"))


MOVIE_DB_URI = os.getenv("MOVIE_DB_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

# Connect to MongoDB
user_client = MongoClient(USER_DB_URI)
user_db = user_client["users"]


movie_client = MongoClient(MOVIE_DB_URI)
movie_db = movie_client["MovieDatabase"]

# Initialize FastAPI
app = FastAPI()

# ✅ Replace with the actual frontend URL you're using
origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost:3001",
    "https://cineit-frontend.onrender.com",
]


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store DB in state
app.state.user_db = user_db
app.state.movie_db = movie_db

# Routes
app.include_router(auth_router, prefix="/api/auth")
app.include_router(genre_router, prefix="/api")
app.include_router(movie_router, prefix="/api/movies")
app.include_router(password_router, prefix="/api/password")
app.include_router(edit_router, prefix="/api/editProfile")
app.include_router(profile_router, prefix="/api/profile")

# ✅ Mount uploads folder so images can be accessed via URL
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Backend API is running"}

@app.get("/users")
def get_users():
    users = list(app.state.user_db.users.find({}, {"_id": 0}))
    return users

@app.get("/movies")
def get_movies():
    movies = list(app.state.movie_db.movies.find({}, {"_id": 0}))
    return movies
