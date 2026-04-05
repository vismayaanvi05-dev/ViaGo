from jose import jwt
from datetime import datetime, timedelta
import random
import string
import os
import math

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 720

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

def generate_order_number(prefix: str = "ORD") -> str:
    now = datetime.utcnow()
    date_part = now.strftime("%Y%m%d")
    random_part = ''.join(random.choices(string.digits, k=3))
    return f"{prefix}{date_part}{random_part}"

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c, 2)

def calculate_delivery_charge(distance_km: float, charge_type: str, flat_charge: float, per_km_charge: float, free_above: float, order_amount: float) -> float:
    if free_above and order_amount >= free_above:
        return 0.0
    if charge_type == "flat":
        return flat_charge
    return round(distance_km * per_km_charge, 2)

def calculate_tax(subtotal: float, tax_percentage: float) -> float:
    return round((subtotal * tax_percentage) / 100, 2)
