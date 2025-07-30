# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pymongo import MongoClient
# from dotenv import load_dotenv
# from pathlib import Path
# import os
# from server.routes.auth import router as auth_router
# from server.routes.genreRoute import router as genre_router
# from server.routes.movieRoute import router as movie_router
# from server.routes.passwordRoute import router as password_router
# from server.routes.editProfileRoute import router as edit_router
# from server.routes.profileRoute import router as profile_router
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import JSONResponse



# # Load .env
# env_path = Path(__file__).resolve().parent / 'server' / '.env'
# load_dotenv(dotenv_path=env_path)
# print("🔍 .env loaded from:", env_path)




# UPLOAD_DIR = Path("/tmp/uploads") if os.getenv("RENDER") else Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
# UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# # Load environment variables
# USER_DB_URI = os.getenv("MONGO_URI", "").strip()
# MOVIE_DB_URI = os.getenv("MOVIE_DB_URI")
# print("🔐 FastAPI is using MOVIE_DB_URI:", repr(MOVIE_DB_URI))
# JWT_SECRET = os.getenv("JWT_SECRET", "").strip()

# print("🔗 USER_DB_URI:", repr(USER_DB_URI))
# print("🔗 MOVIE_DB_URI:", repr(MOVIE_DB_URI))

# # Validate URIs
# if not USER_DB_URI.startswith("mongodb"):
#     raise ValueError("❌ Invalid USER_DB_URI format")
# if not MOVIE_DB_URI.startswith("mongodb"):
#     raise ValueError("❌ Invalid MOVIE_DB_URI format")

# # Connect to MongoDB
# user_client = MongoClient(USER_DB_URI)
# user_db = user_client["users"]

# movie_client = MongoClient(MOVIE_DB_URI)
# movie_db = movie_client["NewMovieDatabase"]
# print("✅ Connected to NewMovieDatabase. Collections:", movie_db.list_collection_names())

# # Initialize FastAPI
# app = FastAPI()

# # CORS
# origins = [
#     "http://localhost:3000",
#     "https://cineit-frontend.onrender.com",
#     "https://cineit.onrender.com",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,

#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Store DB in state
# app.state.user_db = user_db
# app.state.movie_db = movie_db

# # Routes
# app.include_router(auth_router, prefix="/api/auth")
# app.include_router(genre_router, prefix="/api")
# app.include_router(movie_router, prefix="/api/movies")
# app.include_router(password_router, prefix="/api/password")
# app.include_router(edit_router, prefix="/api/editProfile")
# app.include_router(profile_router, prefix="/api/profile")

# @app.get("/")
# def read_root():
#     return {"message": "Backend API is running"}

# @app.get("/users")
# def get_users():
#     users = list(app.state.user_db.users.find({}, {"_id": 0}))
#     return users

# @app.get("/movies")
# def get_movies():
#     movies = list(app.state.movie_db.movies.find({}, {"_id": 0}))
#     return movies


# @app.get("/support/feedback_items")
# def get_feedback_items():
#     # Access the 'feedback' collection within the 'support_db'
#     feedback_items = list(app.state.support_db.feedback.find({}, {"_id": 0}))
#     return feedback_items


# # @app.options("/{rest_of_path:path}")
# # async def preflight_handler():
# #     return JSONResponse(
# #         content={"message": "preflight ok"},
# #         headers={
# #             "Access-Control-Allow-Origin": "*",
# #             "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
# #             "Access-Control-Allow-Headers": "*",
# #         }
# #     )


# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pymongo import MongoClient
# from dotenv import load_dotenv
# from pathlib import Path
# import os
# import socket

# from server.routes.auth import router as auth_router
# from server.routes.genreRoute import router as genre_router
# from server.routes.movieRoute import router as movie_router
# from server.routes.passwordRoute import router as password_router
# from server.routes.editProfileRoute import router as edit_router
# from server.routes.profileRoute import router as profile_router
# from server.routes.feedbackRoute import router as feedback_router
# from server.routes.subscriptionRoute import router as subscription_router
# from server.routes.stripeRoute import router as stripe_router

# # Load .env
# env_path = Path(__file__).resolve().parent / 'server' / '.env'
# load_dotenv(dotenv_path=env_path)
# print("🔍 .env loaded from:", env_path)

# # Upload directory setup
# UPLOAD_DIR = Path("/tmp/uploads") if os.getenv("RENDER") else Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
# UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# # Always use this
# JWT_SECRET = os.getenv("JWT_SECRET", "").strip()

# # Try online connection first
# try:
#     print("🌐 Trying ONLINE MongoDB...")
#     USER_DB_URI = os.getenv("MONGO_URI", "").strip()
#     MOVIE_DB_URI = os.getenv("MOVIE_DB_URI", "").strip()
#     SUPPORT_DB_URI = os.getenv("SUPPORT_DB_URI", "").strip()

#     # Test if online MongoDB is reachable
#     test_client = MongoClient(USER_DB_URI, serverSelectionTimeoutMS=3000)
#     test_client.server_info()  # Force connection
#     print("✅ ONLINE MongoDB reachable")
# except Exception as e:
#     print(f"❌ ONLINE connection failed: {e}")
#     print("📴 Switching to OFFLINE mode")

#     USER_DB_URI = os.getenv("OFFLINE_MONGO_URI", "").strip()
#     MOVIE_DB_URI = os.getenv("OFFLINE_MOVIE_DB_URI", "").strip()
#     SUPPORT_DB_URI = os.getenv("OFFLINE_SUPPORT_DB_URI", "").strip()

# # Print final URIs
# print("🔗 USER_DB_URI:", repr(USER_DB_URI))
# print("🔗 MOVIE_DB_URI:", repr(MOVIE_DB_URI))
# print("🔗 SUPPORT_DB_URI:", repr(SUPPORT_DB_URI))

# # Validate URIs
# if not USER_DB_URI.startswith("mongodb"):
#     raise ValueError("❌ Invalid USER_DB_URI format")
# if not MOVIE_DB_URI.startswith("mongodb"):
#     raise ValueError("❌ Invalid MOVIE_DB_URI format")
# if not SUPPORT_DB_URI.startswith("mongodb"):
#     raise ValueError("❌ Invalid SUPPORT_DB_URI format")

# # Connect to MongoDB
# user_client = MongoClient(USER_DB_URI)
# user_db = user_client["users"]

# movie_client = MongoClient(MOVIE_DB_URI)
# movie_db = movie_client["NewMovieDatabase"]
# print("✅ Connected to NewMovieDatabase. Collections:", movie_db.list_collection_names())

# support_client = MongoClient(SUPPORT_DB_URI)
# support_db = support_client["support"]
# print("✅ Connected to support. Collections:", support_db.list_collection_names())

# # Initialize FastAPI app
# app = FastAPI()

# # CORS
# origins = [
#     "http://localhost:3000",
#     "http://localhost:5173",
#     "https://cineit-frontend.onrender.com",
#     "https://cineit.onrender.com",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Store DB in state
# app.state.user_db = user_db
# app.state.movie_db = movie_db
# app.state.support_db = support_db

# # Routes
# app.include_router(auth_router, prefix="/api/auth")
# app.include_router(genre_router, prefix="/api")
# app.include_router(movie_router, prefix="/api/movies")
# app.include_router(password_router, prefix="/api/password")
# app.include_router(edit_router, prefix="/api/editProfile")
# app.include_router(profile_router, prefix="/api/profile")
# app.include_router(feedback_router, prefix="/api/feedback")
# app.include_router(subscription_router, prefix="/api")
# app.include_router(stripe_router, prefix="/api")

# # Default route
# @app.get("/")
# def read_root():
#     return {"message": "Backend API is running"}

# @app.get("/users")
# def get_users():
#     users = list(app.state.user_db.users.find({}, {"_id": 0}))
#     return users

# @app.get("/movies")
# def get_movies():
#     movies = list(app.state.movie_db.movies.find({}, {"_id": 0}))
#     return movies

# @app.get("/support/feedback_items")
# def get_feedback_items():
#     feedback_items = list(app.state.support_db.feedback.find({}, {"_id": 0}))
#     return feedback_items
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
import threading
import time

# Routers
from server.routes.auth import router as auth_router
from server.routes.genreRoute import router as genre_router
from server.routes.movieRoute import router as movie_router
from server.routes.passwordRoute import router as password_router
from server.routes.editProfileRoute import router as edit_router
from server.routes.profileRoute import router as profile_router
from server.routes.feedbackRoute import router as feedback_router
from server.routes.subscriptionRoute import router as subscription_router
from server.routes.stripeRoute import router as stripe_router

# Load environment variables from .env
env_path = Path(__file__).resolve().parent / 'server' / '.env'
load_dotenv(dotenv_path=env_path)

# Utility to check MongoDB connection
from server.utils.mongo_utils import check_connection

# JWT (optional if used elsewhere)
JWT_SECRET = os.getenv("JWT_SECRET", "").strip()

# ================================
# ✅ Initialize FastAPI App
# ================================
app = FastAPI()

# App state placeholders
app.state.is_online = False
app.state.user_db = None
app.state.movie_db = None
app.state.support_db = None

# ================================
# 🟢 Initial DB Setup (on startup)
# ================================
def init_db_once():
    if check_connection(os.getenv("MONGO_URI", "")):
        print("🌐 Initial connection: ONLINE")
        app.state.is_online = True
        app.state.user_db = MongoClient(os.getenv("MONGO_URI"))["users"]
        app.state.movie_db = MongoClient(os.getenv("MOVIE_DB_URI"))["NewMovieDatabase"]
        app.state.support_db = MongoClient(os.getenv("SUPPORT_DB_URI"))["support"]
    else:
        print("📴 Initial connection: OFFLINE")
        app.state.is_online = False
        app.state.user_db = MongoClient(os.getenv("OFFLINE_MONGO_URI"))["users"]
        app.state.movie_db = MongoClient(os.getenv("OFFLINE_MOVIE_DB_URI"))["NewMovieDatabase"]
        app.state.support_db = MongoClient(os.getenv("OFFLINE_SUPPORT_DB_URI"))["support"]

# ================================
# 🔁 Background MongoDB Monitor
# ================================
def monitor_mongodb():
    while True:
        if check_connection(os.getenv("MONGO_URI", "")):
            if not app.state.is_online:
                print("🔁 Reconnected to ONLINE MongoDB Atlas")
                app.state.is_online = True
                app.state.user_db = MongoClient(os.getenv("MONGO_URI"))["users"]
                app.state.movie_db = MongoClient(os.getenv("MOVIE_DB_URI"))["NewMovieDatabase"]
                app.state.support_db = MongoClient(os.getenv("SUPPORT_DB_URI"))["support"]
        else:
            if app.state.is_online:
                print("⚠️ Lost connection. Switching to OFFLINE MongoDB")
                app.state.is_online = False
                app.state.user_db = MongoClient(os.getenv("OFFLINE_MONGO_URI"))["users"]
                app.state.movie_db = MongoClient(os.getenv("OFFLINE_MOVIE_DB_URI"))["NewMovieDatabase"]
                app.state.support_db = MongoClient(os.getenv("OFFLINE_SUPPORT_DB_URI"))["support"]

        time.sleep(5)  # Check every 5 seconds

@app.on_event("startup")
def start_monitor_thread():
    print("🚀 Starting MongoDB monitor thread...")
    init_db_once()  # Force DB connection immediately
    thread = threading.Thread(target=monitor_mongodb, daemon=True)
    thread.start()

# ================================
# 🌐 CORS Middleware
# ================================
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

# ================================
# 📦 Routers
# ================================
app.include_router(auth_router, prefix="/api/auth")
app.include_router(genre_router, prefix="/api")
app.include_router(movie_router, prefix="/api/movies")
app.include_router(password_router, prefix="/api/password")
app.include_router(edit_router, prefix="/api/editProfile")
app.include_router(profile_router, prefix="/api/profile")
app.include_router(feedback_router, prefix="/api/feedback")
app.include_router(subscription_router, prefix="/api")
app.include_router(stripe_router, prefix="/api")

# ================================
# ✅ Debug / Test Endpoints
# ================================
@app.get("/")
def read_root():
    return {"message": "Backend API is running"}

@app.get("/status")
def get_status():
    return {"online": app.state.is_online}

@app.get("/users")
def get_users():
    if app.state.user_db:
        return list(app.state.user_db.users.find({}, {"_id": 0}))
    return {"error": "Database not connected"}

@app.get("/movies")
def get_movies():
    if app.state.movie_db:
        return list(app.state.movie_db.movies.find({}, {"_id": 0}))
    return {"error": "Database not connected"}

@app.get("/support/feedback_items")
def get_feedback_items():
    if app.state.support_db:
        return list(app.state.support_db.feedback.find({}, {"_id": 0}))
    return {"error": "Database not connected"}
