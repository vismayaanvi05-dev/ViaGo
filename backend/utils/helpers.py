from jose import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import random
import string
import os

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 720  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    """
    Create JWT access token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hashed password
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash password
    """
    return pwd_context.hash(password)

def generate_otp(length: int = 6) -> str:
    """
    Generate numeric OTP
    """
    return ''.join(random.choices(string.digits, k=length))

def generate_order_number(prefix: str = "ORD") -> str:
    """
    Generate unique order number
    Format: ORD20250815001
    """
    now = datetime.utcnow()
    date_part = now.strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.digits, k=3))
    return f"{prefix}{date_part}{random_part}"

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two coordinates in kilometers
    Using Haversine formula
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in km
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    
    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    distance = R * c
    return round(distance, 2)

def calculate_commission(total_amount: float, commission_percentage: float) -> float:
    """
    Calculate commission amount
    """
    return round((total_amount * commission_percentage) / 100, 2)

def calculate_delivery_charge(
    distance_km: float, 
    delivery_charge_type: str,
    flat_charge: float = 0.0,
    per_km_charge: float = 0.0,
    free_delivery_above: float = None,
    order_amount: float = 0.0
) -> float:
    """
    Calculate delivery charge based on settings
    """
    # Free delivery if order above threshold
    if free_delivery_above and order_amount >= free_delivery_above:
        return 0.0
    
    if delivery_charge_type == "flat":
        return flat_charge
    elif delivery_charge_type == "distance_based":
        return round(distance_km * per_km_charge, 2)
    
    return 0.0

def calculate_tax(subtotal: float, tax_percentage: float) -> float:
    """
    Calculate tax amount
    """
    return round((subtotal * tax_percentage) / 100, 2)

def calculate_admin_markup(base_price: float, markup_percentage: float) -> float:
    """
    Calculate admin markup amount
    """
    return round((base_price * markup_percentage) / 100, 2)
