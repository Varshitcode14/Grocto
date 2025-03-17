from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import pytz
from werkzeug.utils import secure_filename
from models import db, User, Student, Seller, Product, CartItem, CartStore, Order, OrderItem, Notification, DeliverySlot, Address, Offer
from flask_bcrypt import Bcrypt
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///grocto.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

db.init_app(app)
bcrypt = Bcrypt(app)

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Grocto API is running"})

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    try:
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
            db.session.commit()
        
        elif data['role'] == 'seller':
            new_seller = Seller(
                user_id=new_user.id,
                store_name=data['storeName'],
                store_address=data['storeAddress'],
                phone_number=data['phoneNumber']
            )
            db.session.add(new_seller)
            db.session.commit()
            
            # Add default delivery slots for new seller
            try:
                default_slots = [
                    {"start_time": "09:00", "end_time": "12:00", "delivery_fee": 15.0},
                    {"start_time": "13:00", "end_time": "15:00", "delivery_fee": 14.0},
                    {"start_time": "15:00", "end_time": "21:00", "delivery_fee": 25.0}
                ]
                
                for slot in default_slots:
                    new_slot = DeliverySlot(
                        seller_id=new_seller.id,
                        start_time=slot["start_time"],
                        end_time=slot["end_time"],
                        delivery_fee=slot["delivery_fee"]
                    )
                    db.session.add(new_slot)
                
                db.session.commit()
            except Exception as e:
                print(f"Error creating default delivery slots: {str(e)}")
                # Continue with registration even if slot creation fails
        
        return jsonify({"message": "Registration successful"}), 201
    
    except Exception as e:
        # If any error occurs, rollback the session
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

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
        
        # Get addresses
        addresses = []
        for addr in student.addresses:
            addresses.append({
                "id": addr.id,
                "name": addr.name,
                "address": addr.address,
                "isDefault": addr.is_default
            })
        
        profile_data = {
            'id': student.id,
            'collegeId': student.college_id,
            'phone': student.phone,
            'department': student.department,
            'addresses': addresses
        }
    elif user.role == 'seller':
        seller = Seller.query.filter_by(user_id=user.id).first()
        
        # Parse delivery persons from JSON string
        delivery_persons = []
        if seller.delivery_persons:
            try:
                delivery_persons = json.loads(seller.delivery_persons)
            except:
                delivery_persons = []
                
        profile_data = {
            'id': seller.id,
            'storeName': seller.store_name,
            'storeAddress': seller.store_address,
            'phoneNumber': seller.phone_number,
            'workingDays': seller.working_days,
            'openingTime': seller.opening_time,
            'closingTime': seller.closing_time,
            'deliveryPersons': delivery_persons
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
            
            # Get addresses
            addresses = []
            for addr in student.addresses:
                addresses.append({
                    "id": addr.id,
                    "name": addr.name,
                    "address": addr.address,
                    "isDefault": addr.is_default
                })
            
            profile_data = {
                'id': student.id,
                'collegeId': student.college_id,
                'phone': student.phone,
                'department': student.department,
                'addresses': addresses
            }
        elif user.role == 'seller':
            seller = Seller.query.filter_by(user_id=user.id).first()
            
            # Parse delivery persons from JSON string
            delivery_persons = []
            if seller.delivery_persons:
                try:
                    delivery_persons = json.loads(seller.delivery_persons)
                except:
                    delivery_persons = []
                    
            profile_data = {
                'id': seller.id,
                'storeName': seller.store_name,
                'storeAddress': seller.store_address,
                'phoneNumber': seller.phone_number,
                'workingDays': seller.working_days,
                'openingTime': seller.opening_time,
                'closingTime': seller.closing_time,
                'deliveryPersons': delivery_persons
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

# Delivery Slot Routes
@app.route('/api/delivery-slots', methods=['GET'])
def get_delivery_slots():
    seller_id = request.args.get('seller_id', type=int)
    
    if not seller_id:
        return jsonify({"error": "Seller ID is required"}), 400
    
    slots = DeliverySlot.query.filter_by(seller_id=seller_id).all()
    
    slot_list = []
    for slot in slots:
        slot_list.append({
            "id": slot.id,
            "startTime": slot.start_time,
            "endTime": slot.end_time,
            "deliveryFee": slot.delivery_fee
        })
    
    return jsonify({"deliverySlots": slot_list}), 200

@app.route('/api/delivery-slots', methods=['POST'])
def add_delivery_slot():
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Validate required fields
    if not data.get('startTime') or not data.get('endTime') or not data.get('deliveryFee'):
        return jsonify({"error": "All fields are required"}), 400
    
    # Create new delivery slot
    new_slot = DeliverySlot(
        seller_id=seller.id,
        start_time=data['startTime'],
        end_time=data['endTime'],
        delivery_fee=float(data['deliveryFee'])
    )
    
    db.session.add(new_slot)
    db.session.commit()
    
    return jsonify({
        "message": "Delivery slot added successfully",
        "deliverySlot": {
            "id": new_slot.id,
            "startTime": new_slot.start_time,
            "endTime": new_slot.end_time,
            "deliveryFee": new_slot.delivery_fee
        }
    }), 201

@app.route('/api/delivery-slots/<int:slot_id>', methods=['PUT'])
def update_delivery_slot(slot_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Find the slot
    slot = DeliverySlot.query.get(slot_id)
    if not slot:
        return jsonify({"error": "Delivery slot not found"}), 404
    
    # Check if slot belongs to this seller
    if slot.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Update slot
    if 'startTime' in data:
        slot.start_time = data['startTime']
    if 'endTime' in data:
        slot.end_time = data['endTime']
    if 'deliveryFee' in data:
        slot.delivery_fee = float(data['deliveryFee'])
    
    db.session.commit()
    
    return jsonify({
        "message": "Delivery slot updated successfully",
        "deliverySlot": {
            "id": slot.id,
            "startTime": slot.start_time,
            "endTime": slot.end_time,
            "deliveryFee": slot.delivery_fee
        }
    }), 200

@app.route('/api/delivery-slots/<int:slot_id>', methods=['DELETE'])
def delete_delivery_slot(slot_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Find the slot
    slot = DeliverySlot.query.get(slot_id)
    if not slot:
        return jsonify({"error": "Delivery slot not found"}), 404
    
    # Check if slot belongs to this seller
    if slot.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Delete slot
    db.session.delete(slot)
    db.session.commit()
    
    return jsonify({"message": "Delivery slot deleted successfully"}), 200

# Store Routes
@app.route('/api/stores', methods=['GET'])
def get_stores():
    # Get limit parameter (optional)
    limit = request.args.get('limit', default=None, type=int)
    
    # Get all sellers
    sellers = Seller.query.all()
    
    # Apply limit if provided
    if limit:
        sellers = sellers[:limit]
        
    store_list = []
    
    for seller in sellers:
        # Count products for this seller
        products_count = Product.query.filter_by(seller_id=seller.id).count()
        
        store_list.append({
            "id": seller.id,
            "name": seller.store_name,
            "address": seller.store_address,
            "phoneNumber": seller.phone_number,
            "workingDays": seller.working_days,
            "openingTime": seller.opening_time,
            "closingTime": seller.closing_time,
            "productsCount": products_count
        })
    
    return jsonify({"stores": store_list}), 200

@app.route('/api/stores/<int:store_id>', methods=['GET'])
def get_store(store_id):
  seller = Seller.query.get(store_id)
  
  if not seller:
      return jsonify({"error": "Store not found"}), 404
  
  # Count products for this seller
  products_count = Product.query.filter_by(seller_id=seller.id).count()
  
  # Get delivery slots
  delivery_slots = DeliverySlot.query.filter_by(seller_id=seller.id).all()
  slots = []
  
  for slot in delivery_slots:
      slots.append({
          "id": slot.id,
          "startTime": slot.start_time,
          "endTime": slot.end_time,
          "deliveryFee": slot.delivery_fee
      })
  
  store_data = {
      "id": seller.id,
      "name": seller.store_name,
      "address": seller.store_address,
      "phoneNumber": seller.phone_number,
      "workingDays": seller.working_days,
      "openingTime": seller.opening_time,
      "closingTime": seller.closing_time,
      "productsCount": products_count,
      "deliverySlots": slots
  }
  
  return jsonify({"store": store_data}), 200

@app.route('/api/stores/<int:store_id>/products', methods=['GET'])
def get_store_products(store_id):
    seller = Seller.query.get(store_id)
    
    if not seller:
        return jsonify({"error": "Store not found"}), 404
    
    products = Product.query.filter_by(seller_id=store_id).all()
    
    product_list = []
    
    for product in products:
        image_url = None
        if product.image_path:
            image_url = f"{request.host_url.rstrip('/')}/api/uploads/{product.image_path}"
        
        product_list.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image": image_url
        })
    
    return jsonify({"products": product_list}), 200

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    # Get limit parameter (optional)
    limit = request.args.get('limit', default=None, type=int)
    
    # Filter products by seller if the user is a seller
    if 'user_id' in session and session['role'] == 'seller':
        user = User.query.get(session['user_id'])
        seller = Seller.query.filter_by(user_id=user.id).first()
        
        # Only show products belonging to this seller
        products = Product.query.filter_by(seller_id=seller.id).all()
    else:
        # For students or non-authenticated users, show all products
        products = Product.query.all()
    
    # Apply limit if provided
    if limit:
        products = products[:limit]
        
    product_list = []
    
    for product in products:
        seller = Seller.query.get(product.seller_id)
        image_url = None
        if product.image_path:
            # Use request.host_url to get the base URL
            image_url = f"{request.host_url.rstrip('/')}/api/uploads/{product.image_path}"
        
        product_list.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image": image_url,
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
    
    # Check if form data is present
    if not request.form:
        return jsonify({"error": "No form data provided"}), 400
    
    # Get product data from form
    name = request.form.get('name')
    description = request.form.get('description', '')
    price = request.form.get('price')
    stock = request.form.get('stock')
    
    # Validate required fields
    if not name or not price or not stock:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        price = float(price)
        stock = int(stock)
    except ValueError:
        return jsonify({"error": "Invalid price or stock value"}), 400
    
    # Create new product
    new_product = Product(
        seller_id=seller.id,
        name=name,
        description=description,
        price=price,
        stock=stock
    )
    
    # Handle image upload if present
    if 'image' in request.files:
        image = request.files['image']
        if image and image.filename:
            # Generate secure filename
            filename = secure_filename(f"{int(datetime.utcnow().timestamp())}_{image.filename}")
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Save the image
            image.save(image_path)
            
            # Set image path in product
            new_product.image_path = filename
    
    db.session.add(new_product)
    db.session.commit()
    
    # Return product data
    return jsonify({
        "message": "Product added successfully",
        "product": {
            "id": new_product.id,
            "name": new_product.name,
            "description": new_product.description,
            "price": new_product.price,
            "stock": new_product.stock,
            "image": f"{request.host_url.rstrip('/')}/api/uploads/{new_product.image_path}" if new_product.image_path else None
        }
    }), 201

# Add this route after the add_product route

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # If user is a seller, check if they own this product
    if 'user_id' in session and session['role'] == 'seller':
        user = User.query.get(session['user_id'])
        seller = Seller.query.filter_by(user_id=user.id).first()
        
        if product.seller_id != seller.id:
            return jsonify({"error": "Unauthorized"}), 401
    
    image_url = None
    if product.image_path:
        image_url = f"{request.host_url.rstrip('/')}/api/uploads/{product.image_path}"
    
    return jsonify({
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image": image_url
        }
    }), 200

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Check if product exists and belongs to this seller
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    if product.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Get product data from form
    name = request.form.get('name')
    description = request.form.get('description', '')
    price = request.form.get('price')
    stock = request.form.get('stock')
    
    # Validate required fields
    if not name or not price or not stock:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        price = float(price)
        stock = int(stock)
    except ValueError:
        return jsonify({"error": "Invalid price or stock value"}), 400
    
    # Update product
    product.name = name
    product.description = description
    product.price = price
    product.stock = stock
    
    # Handle image upload if present
    if 'image' in request.files:
        image = request.files['image']
        if image and image.filename:
            # Generate secure filename
            filename = secure_filename(f"{int(datetime.utcnow().timestamp())}_{image.filename}")
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Save the image
            image.save(image_path)
            
            # Set image path in product
            product.image_path = filename
    
    db.session.commit()
    
    # Return updated product data
    image_url = None
    if product.image_path:
        image_url = f"{request.host_url.rstrip('/')}/api/uploads/{product.image_path}"
    
    return jsonify({
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image": image_url
        }
    }), 200

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Check if product exists and belongs to this seller
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    if product.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Delete the product
    try:
        # Delete the product image if it exists
        if product.image_path:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], product.image_path)
            if os.path.exists(image_path):
                os.remove(image_path)
        
        # Delete the product from the database
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({
            "message": "Product deleted successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete product: {str(e)}"}), 500

# Cart Routes
@app.route('/api/cart', methods=['GET'])
def get_cart():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    cart_items = CartItem.query.filter_by(student_id=student.id).all()
    items = []
    
    # Get store information
    cart_store = CartStore.query.filter_by(student_id=student.id).first()
    store = None
    delivery_slots = []
    
    if cart_store:
        seller = Seller.query.get(cart_store.store_id)
        store = {
            "id": seller.id,
            "name": seller.store_name,
            "address": seller.store_address
        }
        
        # Get delivery slots for this store
        slots = DeliverySlot.query.filter_by(seller_id=seller.id).all()
        for slot in slots:
            delivery_slots.append({
                "id": slot.id,
                "startTime": slot.start_time,
                "endTime": slot.end_time,
                "deliveryFee": slot.delivery_fee
            })
    
    for item in cart_items:
        product = Product.query.get(item.product_id)
        
        image_url = None
        if product.image_path:
            image_url = f"{request.host_url.rstrip('/')}/api/uploads/{product.image_path}"
        
        items.append({
            "id": item.id,
            "product": {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "image": image_url
            },
            "quantity": item.quantity,
            "subtotal": product.price * item.quantity
        })
    
    subtotal = sum(item["subtotal"] for item in items)
    
    # We'll calculate delivery fee during checkout based on selected slot
    delivery_fee = 0
    
    # Calculate total
    total = subtotal + delivery_fee
    
    return jsonify({
        "items": items,
        "store": store,
        "deliverySlots": delivery_slots,
        "summary": {
            "subtotal": subtotal,
            "deliveryFee": delivery_fee,
            "total": total
        }
    }), 200

@app.route('/api/cart/store', methods=['GET'])
def get_cart_store():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    # Get store information
    cart_store = CartStore.query.filter_by(student_id=student.id).first()
    
    if not cart_store:
        return jsonify({"storeId": None}), 200
    
    return jsonify({"storeId": cart_store.store_id}), 200

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    # Validate required fields
    if not data.get('productId'):
        return jsonify({"error": "Product ID is required"}), 400
    
    quantity = data.get('quantity', 1)
    product_id = data.get('productId')
    
    # Check if product exists
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Check if product is in stock
    if product.stock < quantity:
        return jsonify({"error": "Not enough stock available"}), 400
    
    # Get current cart store
    cart_store = CartStore.query.filter_by(student_id=student.id).first()
    
    # If cart has items from another store, clear the cart
    if cart_store and cart_store.store_id != product.seller_id:
        # Delete all cart items
        CartItem.query.filter_by(student_id=student.id).delete()
        # Delete cart store
        db.session.delete(cart_store)
        db.session.commit()
        cart_store = None
    
    # If no cart store, create one
    if not cart_store:
        cart_store = CartStore(
            student_id=student.id,
            store_id=product.seller_id
        )
        db.session.add(cart_store)
    
    # Check if product is already in cart
    cart_item = CartItem.query.filter_by(student_id=student.id, product_id=product_id).first()
    
    if cart_item:
        # Update quantity
        cart_item.quantity += quantity
    else:
        # Add new item to cart
        cart_item = CartItem(
            student_id=student.id,
            product_id=product_id,
            quantity=quantity
        )
        db.session.add(cart_item)
    
    db.session.commit()
    
    return jsonify({
        "message": "Product added to cart",
        "cartItem": {
            "id": cart_item.id,
            "productId": cart_item.product_id,
            "quantity": cart_item.quantity
        }
    }), 201

@app.route('/api/cart/<int:item_id>', methods=['PUT'])
def update_cart_item(item_id):
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    # Validate required fields
    if 'quantity' not in data:
        return jsonify({"error": "Quantity is required"}), 400
    
    quantity = data['quantity']
    
    # Check if cart item exists
    cart_item = CartItem.query.filter_by(id=item_id, student_id=student.id).first()
    if not cart_item:
        return jsonify({"error": "Cart item not found"}), 404
    
    # Check if product exists
    product = Product.query.get(cart_item.product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # If quantity is 0 or less, remove item from cart
    if quantity <= 0:
        db.session.delete(cart_item)
        db.session.commit()
        
        # Check if cart is empty
        remaining_items = CartItem.query.filter_by(student_id=student.id).count()
        if remaining_items == 0:
            # Remove cart store
            cart_store = CartStore.query.filter_by(student_id=student.id).first()
            if cart_store:
                db.session.delete(cart_store)
                db.session.commit()
        
        return jsonify({"message": "Item removed from cart"}), 200
    
    # Check if product has enough stock
    if product.stock < quantity:
        return jsonify({"error": "Not enough stock available"}), 400
    
    # Update quantity
    cart_item.quantity = quantity
    db.session.commit()
    
    return jsonify({
        "message": "Cart item updated",
        "cartItem": {
            "id": cart_item.id,
            "productId": cart_item.product_id,
            "quantity": cart_item.quantity
        }
    }), 200

@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
def remove_cart_item(item_id):
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    # Check if cart item exists
    cart_item = CartItem.query.filter_by(id=item_id, student_id=student.id).first()
    if not cart_item:
        return jsonify({"error": "Cart item not found"}), 404
    
    # Remove item from cart
    db.session.delete(cart_item)
    db.session.commit()
    
    # Check if cart is empty
    remaining_items = CartItem.query.filter_by(student_id=student.id).count()
    if remaining_items == 0:
        # Remove cart store
        cart_store = CartStore.query.filter_by(student_id=student.id).first()
        if cart_store:
            db.session.delete(cart_store)
            db.session.commit()
    
    return jsonify({"message": "Item removed from cart"}), 200

# Order Routes
@app.route('/api/orders', methods=['POST'])
def create_order():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    # Get cart store
    cart_store = CartStore.query.filter_by(student_id=student.id).first()
    if not cart_store:
        return jsonify({"error": "No items in cart"}), 400
    
    seller = Seller.query.get(cart_store.store_id)
    if not seller:
        return jsonify({"error": "Store not found"}), 404
    
    # Get cart items
    cart_items = CartItem.query.filter_by(student_id=student.id).all()
    if not cart_items:
        return jsonify({"error": "No items in cart"}), 400
    
    # Validate delivery time
    if not data.get('deliveryStartTime') or not data.get('deliveryEndTime'):
        return jsonify({"error": "Delivery time is required"}), 400
    
    # Validate delivery address
    if not data.get('deliveryAddress'):
        return jsonify({"error": "Delivery address is required"}), 400
    
    # Find the appropriate delivery slot
    delivery_start_time = data['deliveryStartTime']
    delivery_end_time = data['deliveryEndTime']
    
    # Convert times to 24-hour format for comparison
    start_hour, start_minute = map(int, delivery_start_time.split(':'))
    end_hour, end_minute = map(int, delivery_end_time.split(':'))
    
    # Ensure minimum 1-hour interval
    start_minutes = start_hour * 60 + start_minute
    end_minutes = end_hour * 60 + end_minute
    if end_minutes - start_minutes < 60:
        return jsonify({"error": "Delivery time interval must be at least 1 hour"}), 400
    
    # Find the delivery slot that contains this time
    delivery_slot = None
    for slot in DeliverySlot.query.filter_by(seller_id=seller.id).all():
        slot_start_hour, slot_start_minute = map(int, slot.start_time.split(':'))
        slot_end_hour, slot_end_minute = map(int, slot.end_time.split(':'))
        
        slot_start_minutes = slot_start_hour * 60 + slot_start_minute
        slot_end_minutes = slot_end_hour * 60 + slot_end_minute
        
        if slot_start_minutes <= start_minutes and end_minutes <= slot_end_minutes:
            delivery_slot = slot
            break
    
    if not delivery_slot:
        return jsonify({"error": "Selected delivery time does not match any available slots"}), 400
    
    # Calculate order totals
    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    
    # Get delivery fee from the slot
    delivery_fee = delivery_slot.delivery_fee
    
    # Calculate total
    total_amount = subtotal + delivery_fee
    
    try:
        # Create new order
        new_order = Order(
            student_id=student.id,
            seller_id=seller.id,
            delivery_start_time=delivery_start_time,
            delivery_end_time=delivery_end_time,
            delivery_address=data['deliveryAddress'],
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            status="pending"
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        # Create order items
        for cart_item in cart_items:
            product = Product.query.get(cart_item.product_id)
            
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                product_name=product.name,
                product_price=product.price,
                quantity=cart_item.quantity,
                subtotal=product.price * cart_item.quantity
            )
            
            db.session.add(order_item)
            
            # Update product stock
            product.stock -= cart_item.quantity
            if product.stock < 0:
                product.stock = 0
        
        # Create notification for seller
        seller_user = User.query.get(seller.user_id)
        notification = Notification(
            recipient_id=seller_user.id,
            title="New Order Received",
            message=f"You have received a new order #{new_order.id} from {user.name}.",
            type="order",
            reference_id=new_order.id
        )
        
        db.session.add(notification)
        
        # Clear cart
        for item in cart_items:
            db.session.delete(item)
        
        db.session.delete(cart_store)
        db.session.commit()
        
        print(f"Order {new_order.id} created successfully for seller {seller.id}")
        
        return jsonify({
            "message": "Order placed successfully",
            "orderId": new_order.id
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating order: {str(e)}")
        return jsonify({"error": f"Failed to create order: {str(e)}"}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    
    if user.role == 'student':
        student = Student.query.filter_by(user_id=user.id).first()
        orders = Order.query.filter_by(student_id=student.id).order_by(Order.order_date.desc()).all()
    elif user.role == 'seller':
        seller = Seller.query.filter_by(user_id=user.id).first()
        orders = Order.query.filter_by(seller_id=seller.id).order_by(Order.order_date.desc()).all()
    else:
        return jsonify({"error": "Invalid role"}), 400
    
    order_list = []
    
    for order in orders:
        # Get student or seller info
        if user.role == 'seller':
            student = Student.query.get(order.student_id)
            student_user = User.query.get(student.user_id)
            customer_name = student_user.name
        else:
            seller = Seller.query.get(order.seller_id)
            store_name = seller.store_name
        
        # Format delivery slot for display
        delivery_slot = f"{order.delivery_start_time} - {order.delivery_end_time}"
        
        order_data = {
            "id": order.id,
            "orderDate": order.order_date.isoformat(),
            "deliveryStartTime": order.delivery_start_time,
            "deliveryEndTime": order.delivery_end_time,
            "deliverySlot": delivery_slot,
            "status": order.status,
            "subtotal": order.subtotal,
            "deliveryFee": order.delivery_fee,
            "totalAmount": order.total_amount
        }
        
        if user.role == 'seller':
            order_data["customerName"] = customer_name
        else:
            order_data["storeName"] = store_name
        
        if order.estimated_delivery_time:
            order_data["estimatedDeliveryTime"] = order.estimated_delivery_time.isoformat()
        
        order_list.append(order_data)
    
    # For debugging
    print(f"Returning {len(order_list)} orders for {user.role} {user.name}")
    
    return jsonify({"orders": order_list}), 200

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    # Verify user has access to this order
    if user.role == 'student':
        student = Student.query.filter_by(user_id=user.id).first()
        if order.student_id != student.id:
            return jsonify({"error": "Unauthorized"}), 401
    elif user.role == 'seller':
        seller = Seller.query.filter_by(user_id=user.id).first()
        if order.seller_id != seller.id:
            return jsonify({"error": "Unauthorized"}), 401
    
    # Get order items
    items = []
    for item in order.items:
        product_image = None
        if item.product and item.product.image_path:
            product_image = f"{request.host_url.rstrip('/')}/api/uploads/{item.product.image_path}"
        
        items.append({
            "id": item.id,
            "productId": item.product_id,
            "productName": item.product_name,
            "productPrice": item.product_price,
            "quantity": item.quantity,
            "subtotal": item.subtotal,
            "productImage": product_image
        })
    
    # Get customer or store info
    if user.role == 'seller':
        student = Student.query.get(order.student_id)
        student_user = User.query.get(student.user_id)
        customer = {
            "id": student.id,
            "name": student_user.name,
            "email": student_user.email
        }
        order_data = {
            "customer": customer
        }
    else:
        seller = Seller.query.get(order.seller_id)
        seller_user = User.query.get(seller.user_id)
        store = {
            "id": seller.id,
            "name": seller.store_name,
            "address": seller.store_address,
            "phoneNumber": seller.phone_number
        }
        order_data = {
            "store": store
        }
    
    # Add order details
    order_data.update({
        "id": order.id,
        "orderDate": order.order_date.isoformat(),
        "deliveryStartTime": order.delivery_start_time,
        "deliveryEndTime": order.delivery_end_time,
        "deliveryAddress": order.delivery_address,
        "status": order.status,
        "subtotal": order.subtotal,
        "deliveryFee": order.delivery_fee,
        "totalAmount": order.total_amount,
        "items": items,
        "deliveryPersonContact": order.delivery_person_contact
    })
    
    if order.estimated_delivery_time:
        order_data["estimatedDeliveryTime"] = order.estimated_delivery_time.isoformat()
    
    return jsonify({"order": order_data}), 200

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
  if 'user_id' not in session or session['role'] != 'seller':
      return jsonify({"error": "Unauthorized"}), 401
  
  data = request.json
  user = User.query.get(session['user_id'])
  seller = Seller.query.filter_by(user_id=user.id).first()
  
  order = Order.query.get(order_id)
  if not order:
      return jsonify({"error": "Order not found"}), 404
  
  if order.seller_id != seller.id:
      return jsonify({"error": "Unauthorized"}), 401
  
  # Update order status
  order.status = data['status']
  
  # If accepting order, set estimated delivery time
  if data['status'] == 'accepted' and 'estimatedDeliveryTime' in data:
      try:
          estimated_time = datetime.fromisoformat(data['estimatedDeliveryTime'])
          order.estimated_delivery_time = estimated_time
      except ValueError:
          return jsonify({"error": "Invalid date format"}), 400
  
  # If setting to delivering, set delivery person contact
  if data['status'] == 'delivering' and 'deliveryPersonContact' in data:
      order.delivery_person_contact = data['deliveryPersonContact']
  
  db.session.commit()
  
  # Create notification for student
  student = Student.query.get(order.student_id)
  student_user = User.query.get(student.user_id)
  
  status_message = {
      'accepted': f"Your order #{order.id} has been accepted by {seller.store_name}.",
      'rejected': f"Your order #{order.id} has been rejected by {seller.store_name}.",
      'packaging': f"Your order #{order.id} is now being packaged.",
      'delivering': f"Your order #{order.id} is out for delivery.",
      'delivered': f"Your order #{order.id} has been delivered."
  }
  
  # Add delivery person info to notification if available
  if data['status'] == 'delivering' and order.delivery_person_contact:
      status_message['delivering'] = f"Your order #{order.id} is out for delivery with {order.delivery_person_contact}."
  
  notification = Notification(
      recipient_id=student_user.id,
      title=f"Order {data['status'].capitalize()}",
      message=status_message.get(data['status'], f"Your order #{order.id} status has been updated to {data['status']}."),
      type="order",
      reference_id=order.id
  )
  
  db.session.add(notification)
  db.session.commit()
  
  return jsonify({
      "message": "Order status updated successfully",
      "status": order.status
  }), 200

# Notification Routes
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    
    # Get unread parameter (optional)
    unread_only = request.args.get('unread', default=False, type=bool)
    
    if unread_only:
        notifications = Notification.query.filter_by(recipient_id=user.id, is_read=False).order_by(Notification.created_at.desc()).all()
    else:
        notifications = Notification.query.filter_by(recipient_id=user.id).order_by(Notification.created_at.desc()).all()
    
    notification_list = []
    
    for notification in notifications:
        notification_list.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "referenceId": notification.reference_id,
            "isRead": notification.is_read,
            "createdAt": notification.created_at.isoformat()
        })
    
    return jsonify({"notifications": notification_list}), 200

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({"error": "Notification not found"}), 404
    
    if notification.recipient_id != user.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({
        "message": "Notification marked as read"
    }), 200

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files with proper headers"""
    # Make the uploads folder accessible
    try:
        # Set proper CORS headers for image files
        response = send_from_directory(os.path.abspath(app.config['UPLOAD_FOLDER']), filename)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        # Add content type header if not already set
        if 'Content-Type' not in response.headers:
            # Try to guess the content type based on file extension
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                response.headers['Content-Type'] = f'image/{filename.split(".")[-1].lower()}'
        return response
    except Exception as e:
        print(f"Error serving file {filename}: {str(e)}")
        return jsonify({"error": f"Could not serve file: {str(e)}"}), 404

# Add this new route after the existing routes, before the if __name__ == '__main__' line:

@app.route('/api/student/profile', methods=['GET', 'PUT'])
def student_profile():
    if 'user_id' not in session or session['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    student = Student.query.filter_by(user_id=user.id).first()
    
    if request.method == 'GET':
        # Get addresses
        addresses = []
        for addr in student.addresses:
            addresses.append({
                "id": addr.id,
                "name": addr.name,
                "address": addr.address,
                "isDefault": addr.is_default
            })
        
        return jsonify({
            "profile": {
                "name": user.name,
                "email": user.email,
                "collegeId": student.college_id,
                "phone": student.phone,
                "department": student.department,
                "addresses": addresses
            }
        }), 200
    
    elif request.method == 'PUT':
        try:
            data = request.json
            print(f"Received student profile update data: {data}")
            
            # Update user name if provided
            if 'name' in data and data['name']:
                user.name = data['name']
            
            # Update student profile fields
            if 'phone' in data:
                student.phone = data['phone']
            
            if 'department' in data:
                student.department = data['department']
            
            # Handle addresses if provided
            if 'addresses' in data and isinstance(data['addresses'], list):
                print(f"Processing {len(data['addresses'])} addresses")
                
                # First, delete all existing addresses for this student
                Address.query.filter_by(student_id=student.id).delete()
                db.session.flush()  # Flush changes to DB
                
                # Then add the new addresses
                for addr_data in data['addresses']:
                    # Ensure we have all required fields
                    if not addr_data.get('name') or not addr_data.get('address'):
                        print(f"Skipping address with missing data: {addr_data}")
                        continue
                    
                    # Create new address
                    new_addr = Address(
                        student_id=student.id,
                        name=addr_data.get('name', 'Default Address'),
                        address=addr_data.get('address', ''),
                        is_default=addr_data.get('isDefault', False)
                    )
                    db.session.add(new_addr)
                    print(f"Added new address: {new_addr.name}, {new_addr.address}, default: {new_addr.is_default}")
            
            # Save changes
            db.session.commit()
            print("Student profile updated successfully")
            
            return jsonify({"message": "Profile updated successfully"}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating student profile: {str(e)}")
            return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500

@app.route('/api/seller/profile', methods=['GET', 'PUT'])
def seller_profile():
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    if request.method == 'GET':
        # Parse delivery persons from JSON string
        delivery_persons = []
        if seller.delivery_persons:
            try:
                delivery_persons = json.loads(seller.delivery_persons)
                print(f"Retrieved delivery persons: {delivery_persons}")
            except Exception as e:
                print(f"Error parsing delivery persons during GET: {str(e)}")
                delivery_persons = []
        
        return jsonify({
            "profile": {
                "name": user.name,
                "email": user.email,
                "storeName": seller.store_name,
                "storeAddress": seller.store_address,
                "phoneNumber": seller.phone_number,
                "workingDays": seller.working_days,
                "openingTime": seller.opening_time,
                "closingTime": seller.closing_time,
                "deliveryPersons": delivery_persons
            }
        }), 200
    
    elif request.method == 'PUT':
        data = request.json
        print(f"Received profile update data: {data}")
        
        # Update user name if provided
        if 'name' in data and data['name']:
            user.name = data['name']
        
        # Update seller profile fields
        if 'storeName' in data:
            seller.store_name = data['storeName']
        
        if 'storeAddress' in data:
            seller.store_address = data['storeAddress']
        
        if 'phoneNumber' in data:
            seller.phone_number = data['phoneNumber']
        
        if 'workingDays' in data:
            seller.working_days = data['workingDays']
        
        if 'openingTime' in data:
            seller.opening_time = data['openingTime']
        
        if 'closingTime' in data:
            seller.closing_time = data['closingTime']
        
        # Update delivery persons if provided
        if 'deliveryPersons' in data:
            # Directly store the array as JSON string
            try:
                delivery_persons = data['deliveryPersons']
                # Convert to JSON string
                seller.delivery_persons = json.dumps(delivery_persons)
                print(f"Updated delivery persons: {seller.delivery_persons}")
            except Exception as e:
                print(f"Error updating delivery persons: {str(e)}")
                return jsonify({"error": f"Invalid delivery persons data: {str(e)}"}), 400
        
        try:
            db.session.commit()
            print("Profile updated successfully")
            return jsonify({"message": "Profile updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            print(f"Error committing changes: {str(e)}")
            return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500

# Add these routes after the existing routes in app.py

# Offer Routes
@app.route('/api/offers', methods=['GET'])
def get_offers():
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    offers = Offer.query.filter_by(seller_id=seller.id).order_by(Offer.created_at.desc()).all()
    
    offer_list = []
    for offer in offers:
        # Parse applicable products
        applicable_products = offer.applicable_products
        if applicable_products != 'all':
            try:
                applicable_products = json.loads(applicable_products)
            except:
                applicable_products = []
        
        offer_list.append({
            "id": offer.id,
            "title": offer.title,
            "description": offer.description,
            "discountType": offer.discount_type,
            "amount": offer.amount,
            "minPurchase": offer.min_purchase,
            "applicableProducts": applicable_products,
            "offerLimit": offer.offer_limit,
            "usageCount": offer.usage_count,
            "startingDate": offer.starting_date.isoformat(),
            "closingDate": offer.closing_date.isoformat(),
            "createdAt": offer.created_at.isoformat()
        })
    
    return jsonify({"offers": offer_list}), 200

# Update the get_active_offers function to use IST
@app.route('/api/offers/active', methods=['GET'])
def get_active_offers():
    # Get current date in IST
    ist_now = datetime.now(pytz.timezone('Asia/Kolkata')).date()
    
    # Get all active offers from all sellers
    offers = Offer.query.filter(
        Offer.starting_date <= ist_now,
        Offer.closing_date >= ist_now
    ).order_by(Offer.created_at.desc()).all()
    
    offer_list = []
    for offer in offers:
        # Get seller info
        seller = Seller.query.get(offer.seller_id)
        
        # Parse applicable products
        applicable_products = offer.applicable_products
        if applicable_products != 'all':
            try:
                applicable_products = json.loads(applicable_products)
            except:
                applicable_products = []
        
        offer_list.append({
            "id": offer.id,
            "title": offer.title,
            "description": offer.description,
            "discountType": offer.discount_type,
            "amount": offer.amount,
            "minPurchase": offer.min_purchase,
            "applicableProducts": applicable_products,
            "offerLimit": offer.offer_limit,
            "usageCount": offer.usage_count,
            "startingDate": offer.starting_date.isoformat(),
            "closingDate": offer.closing_date.isoformat(),
            "storeId": seller.id,
            "storeName": seller.store_name
        })
    
    return jsonify({"offers": offer_list}), 200

# Update the get_store_offers function to use IST
@app.route('/api/offers/store/<int:store_id>', methods=['GET'])
def get_store_offers(store_id):
    # Get current date in IST
    ist_now = datetime.now(pytz.timezone('Asia/Kolkata')).date()
    
    # Get active offers for a specific store
    offers = Offer.query.filter(
        Offer.seller_id == store_id,
        Offer.starting_date <= ist_now,
        Offer.closing_date >= ist_now
    ).order_by(Offer.created_at.desc()).all()
    
    offer_list = []
    for offer in offers:
        # Parse applicable products
        applicable_products = offer.applicable_products
        if applicable_products != 'all':
            try:
                applicable_products = json.loads(applicable_products)
            except:
                applicable_products = []
        
        offer_list.append({
            "id": offer.id,
            "title": offer.title,
            "description": offer.description,
            "discountType": offer.discount_type,
            "amount": offer.amount,
            "minPurchase": offer.min_purchase,
            "applicableProducts": applicable_products,
            "offerLimit": offer.offer_limit,
            "usageCount": offer.usage_count,
            "startingDate": offer.starting_date.isoformat(),
            "closingDate": offer.closing_date.isoformat()
        })
    
    return jsonify({"offers": offer_list}), 200

# Update the create_offer function to use IST
@app.route('/api/offers', methods=['POST'])
def create_offer():
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Validate required fields
    required_fields = ['title', 'discountType', 'amount', 'minPurchase', 'startingDate', 'closingDate']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate dates - parse as IST
    try:
        # Parse dates as IST
        ist_tz = pytz.timezone('Asia/Kolkata')
        starting_date = datetime.fromisoformat(data['startingDate']).replace(tzinfo=ist_tz).date()
        closing_date = datetime.fromisoformat(data['closingDate']).replace(tzinfo=ist_tz).date()
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400
    
    # Validate discount type
    if data['discountType'] not in ['percentage', 'fixed']:
        return jsonify({"error": "Invalid discount type"}), 400
    
    # Prepare applicable products
    applicable_products = data.get('applicableProducts', 'all')
    if applicable_products != 'all':
        applicable_products = json.dumps(applicable_products)
    
    # Create new offer
    new_offer = Offer(
        seller_id=seller.id,
        title=data['title'],
        description=data.get('description', ''),
        discount_type=data['discountType'],
        amount=float(data['amount']),
        min_purchase=float(data['minPurchase']),
        applicable_products=applicable_products,
        offer_limit=int(data.get('offerLimit', 0)),
        starting_date=starting_date,
        closing_date=closing_date
    )
    
    db.session.add(new_offer)
    db.session.commit()
    
    return jsonify({
        "message": "Offer created successfully",
        "offerId": new_offer.id
    }), 201

@app.route('/api/offers/<int:offer_id>', methods=['PUT'])
def update_offer(offer_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Find the offer
    offer = Offer.query.get(offer_id)
    if not offer:
        return jsonify({"error": "Offer not found"}), 404
    
    # Check if offer belongs to this seller
    if offer.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Update offer fields
    if 'title' in data:
        offer.title = data['title']
    
    if 'description' in data:
        offer.description = data['description']
    
    if 'discountType' in data:
        if data['discountType'] not in ['percentage', 'fixed']:
            return jsonify({"error": "Invalid discount type"}), 400
        offer.discount_type = data['discountType']
    
    if 'amount' in data:
        offer.amount = float(data['amount'])
    
    if 'minPurchase' in data:
        offer.min_purchase = float(data['minPurchase'])
    
    if 'applicableProducts' in data:
        applicable_products = data['applicableProducts']
        if applicable_products != 'all':
            applicable_products = json.dumps(applicable_products)
        offer.applicable_products = applicable_products
    
    if 'offerLimit' in data:
        offer.offer_limit = int(data['offerLimit'])
    
    if 'startingDate' in data:
        try:
            offer.starting_date = datetime.fromisoformat(data['startingDate']).date()
        except ValueError:
            return jsonify({"error": "Invalid starting date format"}), 400
    
    if 'closingDate' in data:
        try:
            offer.closing_date = datetime.fromisoformat(data['closingDate']).date()
        except ValueError:
            return jsonify({"error": "Invalid closing date format"}), 400
    
    db.session.commit()
    
    return jsonify({
        "message": "Offer updated successfully"
    }), 200

@app.route('/api/offers/<int:offer_id>', methods=['DELETE'])
def delete_offer(offer_id):
    if 'user_id' not in session or session['role'] != 'seller':
        return jsonify({"error": "Unauthorized"}), 401
    
    user = User.query.get(session['user_id'])
    seller = Seller.query.filter_by(user_id=user.id).first()
    
    # Find the offer
    offer = Offer.query.get(offer_id)
    if not offer:
        return jsonify({"error": "Offer not found"}), 404
    
    # Check if offer belongs to this seller
    if offer.seller_id != seller.id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Delete offer
    db.session.delete(offer)
    db.session.commit()
    
    return jsonify({
        "message": "Offer deleted successfully"
    }), 200

if __name__ == '__main__':
    app.run(debug=True)

