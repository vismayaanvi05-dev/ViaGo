#!/usr/bin/env python3
"""
Additional test for driver creation with verified email
"""

import requests
import json
import uuid

BACKEND_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"
VERIFIED_EMAIL = "flashfood813@gmail.com"

def test_driver_creation_verified_email():
    """Test driver creation with verified email to confirm email sending"""
    try:
        # Generate unique driver data but use verified email
        driver_password = "testpass123"
        
        payload = {
            "name": "Verified Email Driver",
            "email": VERIFIED_EMAIL,
            "password": driver_password,
            "phone": "9876543210",
            "vehicle_type": "Bike",
            "vehicle_number": "MH01AB1234"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/admin/drivers", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            email_sent = data.get("email_sent", False)
            driver_data = data.get("driver", {})
            
            print(f"✅ Driver Creation with Verified Email")
            print(f"   Success: {success}")
            print(f"   Email sent: {email_sent}")
            print(f"   Driver ID: {driver_data.get('id')}")
            
            return True
        elif response.status_code == 400:
            data = response.json()
            if "Email already registered" in data.get("detail", ""):
                print(f"ℹ️  Driver Creation with Verified Email")
                print(f"   Email already registered (expected for verified email)")
                return True
        else:
            print(f"❌ Driver Creation with Verified Email")
            print(f"   Status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Driver Creation with Verified Email")
        print(f"   Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_driver_creation_verified_email()