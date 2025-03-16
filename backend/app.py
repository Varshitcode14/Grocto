from flask import Flask, jsonify, request, session
from flask_cors import CORS
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# In-memory database for demonstration
users = {
    'students': [],
    'sellers': []
}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Grocto API is running"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    user_type = data.get('userType')
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not all([user_type, email, password, name]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if user already exists
    if user_type == 'student':
        for user in users['students']:
            if user['email'] == email:
                return jsonify({"error": "Email already registered"}), 400
        
        # Create new student user
        new_user = {
            'id': len(users['students']) + 1,
            'name': name,
            'email': email,
            'password_hash': generate_password_hash(password)
        }
        users['students'].append(new_user)
    
    elif user_type == 'seller':
        for user in users['sellers']:
            if user['email'] == email:
                return jsonify({"error": "Email already registered"}), 400
        
        # Create new seller user
        store_name = data.get('storeName')
        store_address = data.get('storeAddress')
        phone_number = data.get('phoneNumber')
        
        if not all([store_name, store_address, phone_number]):
            return jsonify({"error": "Missing seller information"}), 400
        
        new_user = {
            'id': len(users['sellers']) + 1,
            'name': name,
            'email': email,
            'password_hash': generate_password_hash(password),
            'store_name': store_name,
            'store_address': store_address,
            'phone_number': phone_number
        }
        users['sellers'].append(new_user)
    
    else:
        return jsonify({"error": "Invalid user type"}), 400
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user_type = data.get('userType')
    email = data.get('email')
    password = data.get('password')
    
    if not all([user_type, email, password]):
        return jsonify({"error": "Missing required fields"}), 400
    
    if user_type == 'student':
        user_list = users['students']
    elif user_type == 'seller':
        user_list = users['sellers']
    else:
        return jsonify({"error": "Invalid user type"}), 400
    
    for user in user_list:
        if user['email'] == email and check_password_hash(user['password_hash'], password):
            # Set session
            session['user_id'] = user['id']
            session['user_type'] = user_type
            
            # Return user info (excluding password)
            user_info = {k: v for k, v in user.items() if k != 'password_hash'}
            return jsonify({"message": "Login successful", "user": user_info}), 200
    
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('user_type', None)
    return jsonify({"message": "Logout successful"}), 200

if __name__ == '__main__':
    app.run(debug=True)

