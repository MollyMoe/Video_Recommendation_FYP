# from flask import Flask, request, jsonify
# from flask_pymongo import PyMongo
# from werkzeug.security import generate_password_hash, check_password_hash
# import jwt
# from datetime import datetime, timedelta
# from dotenv import load_dotenv
# import os
# from flask_cors import CORS
# app = Flask(__name__)   
# CORS(app)   

# # Load environment variables from .env file
# load_dotenv()

# app.config["MONGO_URI"] = "mongodb://localhost:27017/MovieDataSet"
# app.config['SECRET_KEY'] = os.getenv('JWT_SECRET')

# mongo = PyMongo(app)
# users = mongo.db.users

# # Signup route
# @app.route('/api/auth/signup', methods=['POST'])
# def signup():
#     data = request.get_json()

#     fullName = data.get('fullName')
#     username = data.get('username')
#     email = data.get('email')
#     password = data.get('password')
#     userType = data.get('userType')

#     if users.find_one({'username': username}):
#         return jsonify({'error': 'Username already exists'}), 400

#     hashed_password = generate_password_hash(password)
#     user_data = {
#         'fullName': fullName,
#         'username': username,
#         'email': email,
#         'password': hashed_password,
#         'userType': userType
#     }
#     users.insert_one(user_data)

#     return jsonify({'message': 'User created successfully'}), 201

# # Signin (login) route
# @app.route('/api/auth/signin', methods=['POST'])
# def signin():
#     data = request.get_json()
#     username = data.get('username')
#     password = data.get('password')

#     user = users.find_one({'username': username})
#     if not user or not check_password_hash(user['password'], password):
#         return jsonify({'error': 'Invalid credentials'}), 400

#     payload = {
#         'id': str(user['_id']),
#         'username': user['username'],
#         'userType': user['userType'],
#         'exp': datetime.utcnow() + timedelta(hours=1)
#     }

#     token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

#     return jsonify({
#         'message': 'Login successful',
#         'token': token,
#         'user': {
#             'username': user['username'],
#             'userType': user['userType']
#         }
#     })

# @app.route('/testdb')
# def testdb():
#     user = mongo.db.users.find_one()
#     if user:
#         return str(user)
#     else:
#         return "No user found"

# @app.route('/h')
# def home():
#     return "Hello, Flask is running!"

# if __name__ == '__main__':
#     app.run(port=3000, debug=True)