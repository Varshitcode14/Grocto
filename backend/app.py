from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///grocto.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'student' or 'seller'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    college_id = db.Column(db.String(50), nullable=False)
    user = db.relationship('User', backref=db.backref('student', uselist=False))

class Seller(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    store_name = db.Column(db.String(100), nullable=False)
    store_address = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    working_days = db.Column(db.String(100), default="Monday-Friday")
    opening_time = db.Column(db.String(10), default="09:00")
    closing_time = db.Column(db.String(10), default="18:00")
    user = db.relationship('User', backref=db.backref('seller', uselist=False))

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_path = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    seller = db.relationship('Seller', backref=db.backref('products', lazy=True))

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    student = db.relationship('Student', backref=db.backref('cart_items', lazy=True))
    product = db.relationship('Product')

# Create database tables
with app.app_context():
    db.create_all()

# In-memory database for demonstration
# users = {
#     'students': [],
#     'sellers': []
# }

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Grocto API is running"})

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create new user
    new_user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        role=data['role']
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Create role-specific profile
    if data['role'] == 'student':
        new_student = Student(
            user_id=new_user.id,
            college_id=data['collegeId']
        )
        db.session.add(new_student)
    
    elif data['role'] == 'seller':
        new_seller = Seller(
            user_id=new_user.id,
            store_name=data['storeName'],
            store_address=data['storeAddress'],
            phone_number=data['phoneNumber']
        )
        db.session.add(new_seller)
    
    db.session.commit()
    
    return jsonify({"message": "Registration successful"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Set session data
    session['user_id'] = user.id
    session['role'] = user.role
    
    # Get role-specific data
    profile_data = {}
    if user.role == 'student':
        student = Student.query.filter_by(user_id=user.id).first()
        profile_data = {
            'collegeId': student.college_id
        }
    elif user.role == 'seller':
        seller = Seller.query.filter_by(user_id=user.id).first()
        profile_data = {
            'storeName': seller.store_name,
            'storeAddress': seller.store_address,
            'phoneNumber': seller.phone_number,
            'workingDays': seller.working_days,
            'openingTime': seller.opening_time,
            'closingTime': seller.closing_time
        }
    
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "profile": profile_data
        }
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('role', None)
    return jsonify({"message": "Logout successful"}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        
        if not user:
            return jsonify({"authenticated": False}), 200
        
        # Get role-specific data
        profile_data = {}
        if user.role == 'student':
            student = Student.query.filter_by(user_id=user.id).first()
            profile_data = {
                'collegeId': student.college_id
            }
        elif user.role == 'seller':
            seller = Seller.query.filter_by(user_id=user.id).first()
            profile_data = {
                'storeName': seller.store_name,
                'storeAddress': seller.store_address,
                'phoneNumber': seller.phone_number,
                'workingDays': seller.working_days,
                'openingTime': seller.opening_time,
                'closingTime': seller.closing_time
            }
        
        return jsonify({
            "authenticated": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "profile": profile_data
            }
        }), 200
    
    return jsonify({"authenticated": False}), 200

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    product_list = []
    
    for product in products:
        seller = Seller.query.get(product.seller_id)
        product_list.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image": f"/api/uploads/{product.image_path}" if product.image_path else None,
            "seller": {
                "id": seller.id,
                "storeName": seller.store_name
            }
        })
    
    return jsonify({"products": product_list}), 200

@app.route('/api/products', methods=['POST'])
def add_product():
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Handle form data and file upload
    name = request.form.get('name')
    description = request.form.get('description')
    price = float(request.form.get('price'))
    stock = int(request.form.get('stock'))
    
    image_path = None
    if 'image' in request.files:
        file = request.files['image']
        if file.filename:
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            image_path = unique_filename
    
    new_product = Product(
        seller_id=seller.id,
        name=name,
        description=description,
        price=price,
        stock=stock,
        image_path=image_path
    )
    
    db.session.add(new_product)
    db.session.commit()
    
    return jsonify({
        "message": "Product added successfully",
        "product": {
            "id": new_product.id,
            "name": new_product.name,
            "description": new_product.description,
            "price": new_product.price,
            "stock": new_product.stock,
            "image": f"/api/uploads/{new_product.image_path}" if new_product.image_path else None
        }
    }), 201

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    if product.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Update product details
    product.name = request.form.get('name', product.name)
    product.description = request.form.get('description', product.description)
    product.price = float(request.form.get('price', product.price))
    product.stock = int(request.form.get('stock', product.stock))
    
    # Update image if provided
    if 'image' in request.files:
        file = request.files['image']
        if file.filename:
            # Remove old image if exists
            if product.image_path:
                old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], product.image_path)
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            # Save new image
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            product.image_path = unique_filename
    
    db.session.commit()
    
    return jsonify({
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image": f"/api/uploads/{product.image_path}" if product.image_path else None
        }
    }), 200

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    if product.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Remove image if exists
    if product.image_path:
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], product.image_path)
        if os.path.exists(image_path):
            os.remove(image_path)
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({"message": "Product deleted successfully"}), 200

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Seller Profile Routes
@app.route('/api/seller/profile', methods=['PUT'])
def update_seller_profile():
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Update user details
    user.name = data.get('name', user.name)
    
    # Update seller details
    seller.store_name = data.get('storeName', seller.store_name)
    seller.store_address = data.get('storeAddress', seller.store_address)
    seller.phone_number = data.get('phoneNumber', seller.phone_number)
    seller.working_days = data.get('workingDays', seller.working_days)
    seller.opening_time = data.get('openingTime', seller.opening_time)
    seller.closing_time = data.get('closingTime', seller.closing_time)
    
    db.session.commit()
    
    return jsonify({
        "message": "Profile updated successfully",
        "profile": {
            "name": user.name,
            "storeName": seller.store_name,
            "storeAddress": seller.store_address,
            "phoneNumber": seller.phone_number,
            "workingDays": seller.working_days,
            "openingTime": seller.opening_time,
            "closingTime": seller.closing_time
        }
    }), 200

# Cart Routes
@app.route('/api/cart', methods=['GET'])
def get_cart():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    cart_items = CartItem.query.filter_by(student_id=student.id).all()
    items = []
    
    for item in cart_items:
        product = Product.query.get(item.product_id)
        seller = Seller.query.get(product.seller_id)
        
        items.append({
            "id": item.id,
            "product": {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "image": f"/api/uploads/{product.image_path}" if product.image_path else None
            },
            "quantity": item.quantity,
            "seller": {
                "storeName": seller.store_name
            },
            "subtotal": product.price * item.quantity
        })
    
    total = sum(item["subtotal"] for item in items)
    
    return jsonify({
        "items": items,
        "total": total
    }), 200

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    product = Product.query.get(data['productId'])
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Check if product is already in cart
    cart_item = CartItem.query.filter_by(
        student_id=student.id,
        product_id=product.id
    ).first()
    
    if cart_item:
        # Update quantity
        cart_item.quantity += data.get('quantity', 1)
    else:
        # Add new item to cart
        cart_item = CartItem(
            student_id=student.id,
            product_id=product.id,
            quantity=data.get('quantity', 1)
        )
        db.session.add(cart_item)
    
    db.session.commit()
    
    return jsonify({"message": "Product added to cart"}), 200

@app.route('/api/cart/<int:item_id>', methods=['PUT'])
def update_cart_item(item_id):
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    cart_item = CartItem.query.get(item_id)
    if not cart_item or cart_item.student_id != student.id:
        return jsonify({"error": "Item not found"}), 404
    
    cart_item.quantity = data['quantity']
    
    if cart_item.quantity <= 0:
        db.session.delete(cart_item)
    
    db.session.commit()
    
    return jsonify({"message": "Cart updated"}), 200

@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
def remove_from_cart(item_id):
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    cart_item = CartItem.query.get(item_id)
    if not cart_item or cart_item.student_id != student.id:
        return jsonify({"error": "Item not found"}), 404
    
    db.session.delete(cart_item)
    db.session.commit()
    
    return jsonify({"message": "Item removed from cart"}), 200

if __name__ == '__main__':
    app.run(debug=True)

