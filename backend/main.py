from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
import socket

from server.routes.auth import router as auth_router
from server.routes.genreRoute import router as genre_router
from server.routes.movieRoute import router as movie_router
from server.routes.passwordRoute import router as password_router
from server.routes.editProfileRoute import router as edit_router
from server.routes.profileRoute import router as profile_router
from server.routes.feedbackRoute import router as feedback_router
from server.routes.subscriptionRoute import router as subscription_router
from server.routes.stripeRoute import router as stripe_router

from dynamic_env import set_env
set_env()
# Load .env
env_path = Path(__file__).resolve().parent / 'server' / '.env'
load_dotenv(dotenv_path=env_path)
print("🔍 .env loaded from:", env_path)

# Upload directory setup
UPLOAD_DIR = Path("/tmp/uploads") if os.getenv("RENDER") else Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Always use this
JWT_SECRET = os.getenv("JWT_SECRET", "").strip()

# Try online connection first
try:
    print("🌐 Trying ONLINE MongoDB...")
    USER_DB_URI = os.getenv("MONGO_URI", "").strip()
    MOVIE_DB_URI = os.getenv("MOVIE_DB_URI", "").strip()
    SUPPORT_DB_URI = os.getenv("SUPPORT_DB_URI", "").strip()

    # Test if online MongoDB is reachable
    test_client = MongoClient(USER_DB_URI, serverSelectionTimeoutMS=3000)
    test_client.server_info()  # Force connection
    print("✅ ONLINE MongoDB reachable")
except Exception as e:
    print(f"❌ ONLINE connection failed: {e}")
    print("📴 Switching to OFFLINE mode")

    USER_DB_URI = os.getenv("OFFLINE_MONGO_URI", "").strip()
    MOVIE_DB_URI = os.getenv("OFFLINE_MOVIE_DB_URI", "").strip()
    SUPPORT_DB_URI = os.getenv("OFFLINE_SUPPORT_DB_URI", "").strip()

# Print final URIs
print("🔗 USER_DB_URI:", repr(USER_DB_URI))
print("🔗 MOVIE_DB_URI:", repr(MOVIE_DB_URI))
print("🔗 SUPPORT_DB_URI:", repr(SUPPORT_DB_URI))

# Validate URIs
if not USER_DB_URI.startswith("mongodb"):
    raise ValueError("❌ Invalid USER_DB_URI format")
if not MOVIE_DB_URI.startswith("mongodb"):
    raise ValueError("❌ Invalid MOVIE_DB_URI format")
if not SUPPORT_DB_URI.startswith("mongodb"):
    raise ValueError("❌ Invalid SUPPORT_DB_URI format")

# Connect to MongoDB
user_client = MongoClient(USER_DB_URI)
user_db = user_client["users"]

movie_client = MongoClient(MOVIE_DB_URI)
movie_db = movie_client["NewMovieDatabase"]
print("✅ Connected to NewMovieDatabase. Collections:", movie_db.list_collection_names())

support_client = MongoClient(SUPPORT_DB_URI)
support_db = support_client["support"]
print("✅ Connected to support. Collections:", support_db.list_collection_names())

# Initialize FastAPI app
app = FastAPI()

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://cineit-frontend.onrender.com",
    "https://cineit.onrender.com",
]
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
app.state.support_db = support_db

# Routes
app.include_router(auth_router, prefix="/api/auth")
app.include_router(genre_router, prefix="/api")
app.include_router(movie_router, prefix="/api/movies")
app.include_router(password_router, prefix="/api/password")
app.include_router(edit_router, prefix="/api/editProfile")
app.include_router(profile_router, prefix="/api/profile")
app.include_router(feedback_router, prefix="/api")
app.include_router(subscription_router, prefix="/api")
app.include_router(stripe_router, prefix="/api")

# Default route
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

@app.get("/support/feedback_items")
def get_feedback_items():
    feedback_items = list(app.state.support_db.feedback.find({}, {"_id": 0}))
    return feedback_items