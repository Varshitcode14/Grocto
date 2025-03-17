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
    addresses = db.relationship('Address', backref='student', lazy=True, cascade="all, delete-orphan")
    user = db.relationship('User', backref=db.backref('student', uselist=False))

class Address(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
  name = db.Column(db.String(100), nullable=False)
  address = db.Column(db.Text, nullable=False)
  is_default = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Seller(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    store_name = db.Column(db.String(100), nullable=False)
    store_address = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    working_days = db.Column(db.String(100), default="Monday-Friday")
    opening_time = db.Column(db.String(10), default="09:00")
    closing_time = db.Column(db.String(10), default="18:00")
    delivery_persons = db.Column(db.Text, default="[]")  # JSON string of delivery persons
    user = db.relationship('User', backref=db.backref('seller', uselist=False))

# Delivery Slot Model
class DeliverySlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # Format: "HH:MM"
    end_time = db.Column(db.String(10), nullable=False)    # Format: "HH:MM"
    delivery_fee = db.Column(db.Float, nullable=False)
    seller = db.relationship('Seller', backref=db.backref('delivery_slots', lazy=True))

# Offer Model
class Offer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    discount_type = db.Column(db.String(20), nullable=False)  # 'percentage' or 'fixed'
    amount = db.Column(db.Float, nullable=False)  # percentage or fixed amount
    min_purchase = db.Column(db.Float, nullable=False, default=0)
    applicable_products = db.Column(db.Text, default="all")  # 'all' or JSON string of product IDs
    offer_limit = db.Column(db.Integer, nullable=False, default=0)  # 0 means unlimited
    usage_count = db.Column(db.Integer, default=0)
    starting_date = db.Column(db.Date, nullable=False)
    closing_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
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
    seller = db.relationship('Seller', backref=db.backref('products', lazy=True))

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    student = db.relationship('Student', backref=db.backref('cart_items', lazy=True))
    product = db.relationship('Product')

class CartStore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    student = db.relationship('Student', backref=db.backref('cart_store', uselist=False))
    store = db.relationship('Seller')

# Order Models
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('seller.id'), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    delivery_start_time = db.Column(db.String(10), nullable=False)  # Format: "HH:MM"
    delivery_end_time = db.Column(db.String(10), nullable=False)    # Format: "HH:MM"
    delivery_address = db.Column(db.String(200), nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    delivery_fee = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, accepted, rejected, packaging, delivering, delivered
    estimated_delivery_time = db.Column(db.DateTime, nullable=True)
    delivery_person_contact = db.Column(db.String(200), nullable=True)  # Name and phone of delivery person
    student = db.relationship('Student', backref=db.backref('orders', lazy=True))
    seller = db.relationship('Seller', backref=db.backref('orders', lazy=True))

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    product_price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    discount_info = db.Column(db.Text, nullable=True)  # JSON string with discount details
    order = db.relationship('Order', backref=db.backref('items', lazy=True))
    product = db.relationship('Product')

# Notification Model
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default="info")  # info, order, system
    reference_id = db.Column(db.Integer, nullable=True)  # e.g., order_id
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    recipient = db.relationship('User', backref=db.backref('notifications', lazy=True))

