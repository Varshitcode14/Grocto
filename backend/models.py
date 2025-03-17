from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# User Models
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
    phone = db.Column(db.String(20))
    department = db.Column(db.String(100))
    
    # Relationships
    user = db.relationship('User', backref=db.backref('student', uselist=False))
    addresses = db.relationship('Address', backref='student', lazy=True)
    cart_items = db.relationship('CartItem', backref='student', lazy=True)
    orders = db.relationship('Order', backref='student', lazy=True)

class Address(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
  name = db.Column(db.String(100), nullable=False)  # e.g., "Home", "Hostel"
  address = db.Column(db.String(200), nullable=False)
  is_default = db.Column(db.Boolean, default=False)
  

class Seller(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    store_name = db.Column(db.String(100), nullable=False)
    store_address = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    working_days = db.Column(db.String(100))  # e.g., "Mon,Tue,Wed,Thu,Fri"
    opening_time = db.Column(db.String(10))  # e.g., "09:00"
    closing_time = db.Column(db.String(10))  # e.g., "18:00"
    delivery_persons = db.Column(db.Text)  # JSON string of delivery persons
    
    # Relationships
    user = db.relationship('User', backref=db.backref('seller', uselist=False))
    products = db.relationship('Product', backref='seller', lazy=True)
    delivery_slots = db.relationship('DeliverySlot', backref='seller', lazy=True)
    orders = db.relationship('Order', backref='seller', lazy=True)

# Delivery Slot Model
class DeliverySlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # e.g., "09:00"
    end_time = db.Column(db.String(10), nullable=False)  # e.g., "12:00"
    delivery_fee = db.Column(db.Float, nullable=False)

# Offer Model
class Offer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    discount_type = db.Column(db.String(20), nullable=False)  # percentage, fixed
    amount = db.Column(db.Float, nullable=False)  # percentage or fixed amount
    min_purchase = db.Column(db.Float, default=0)  # minimum purchase amount
    applicable_products = db.Column(db.Text, default='all')  # 'all' or JSON string of product IDs
    offer_limit = db.Column(db.Integer, default=0)  # 0 means unlimited
    usage_count = db.Column(db.Integer, default=0)
    starting_date = db.Column(db.Date, nullable=False)
    closing_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    seller = db.relationship('Seller', backref=db.backref('offers', lazy=True))

# Product Models
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_path = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    # Relationships
    product = db.relationship('Product')

class CartStore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)

# Order Models
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    delivery_start_time = db.Column(db.String(10), nullable=False)  # e.g., "09:00"
    delivery_end_time = db.Column(db.String(10), nullable=False)  # e.g., "12:00"
    delivery_address = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, packaging, delivering, delivered
    subtotal = db.Column(db.Float, nullable=False)
    delivery_fee = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    estimated_delivery_time = db.Column(db.DateTime)
    delivery_person_contact = db.Column(db.String(100))
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    product_price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    discount_info = db.Column(db.Text)  # JSON string with discount details
    
    # Relationships
    product = db.relationship('Product')

# Notification Model
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # e.g., 'order', 'system'
    reference_id = db.Column(db.Integer)  # e.g., order_id
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    recipient = db.relationship('User', backref=db.backref('notifications', lazy=True))

