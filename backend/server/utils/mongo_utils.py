from pymongo import MongoClient, errors

def check_connection(uri: str, timeout=1000) -> bool:
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=timeout)
        client.admin.command("ping")
        return True
    except errors.PyMongoError:
        return False
