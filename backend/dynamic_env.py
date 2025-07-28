import os
import socket
from dotenv import load_dotenv

load_dotenv()

def is_online():
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=1)
        return True
    except:
        return False

def set_env():
    if is_online():
        print("🌐 ONLINE mode")
        os.environ["MONGO_URI"] = os.getenv("MONGO_URI")
        os.environ["MOVIE_DB_URI"] = os.getenv("MOVIE_DB_URI")
        os.environ["SUPPORT_DB_URI"] = os.getenv("SUPPORT_DB_URI")
    else:
        print("📴 OFFLINE mode")
        os.environ["MONGO_URI"] = os.getenv("OFFLINE_MONGO_URI")
        os.environ["MOVIE_DB_URI"] = os.getenv("OFFLINE_MOVIE_DB_URI")
        os.environ["SUPPORT_DB_URI"] = os.getenv("OFFLINE_SUPPORT_DB_URI")
