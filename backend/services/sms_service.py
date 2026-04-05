"""
SMS Service for sending OTPs via Twilio
Replaces mocked OTP system with real SMS delivery
"""
import os
from twilio.rest import Client
from datetime import datetime, timedelta
import random
import logging

logger = logging.getLogger(__name__)

class SMSService:
    """
    Handles SMS sending via Twilio
    Supports both Twilio Verify API (recommended) and standard SMS API
    """
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.verify_service_sid = os.getenv("TWILIO_VERIFY_SERVICE")
        self.from_phone = os.getenv("TWILIO_PHONE_NUMBER")
        
        # Check if Twilio is configured
        self.is_configured = bool(self.account_sid and self.auth_token)
        
        if self.is_configured:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio SMS service initialized")
        else:
            logger.warning("Twilio not configured - using mock OTP mode")
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(length)])
    
    async def send_otp_via_verify(self, phone: str) -> dict:
        """
        Send OTP using Twilio Verify API (recommended)
        Handles OTP generation, storage, and expiry automatically
        """
        if not self.is_configured or not self.verify_service_sid:
            # Mock mode for development
            otp = self.generate_otp()
            logger.info(f"MOCK MODE: OTP for {phone}: {otp}")
            return {
                "success": True,
                "otp": otp,  # Only for testing/mock mode
                "message": "OTP sent successfully (mock mode)",
                "mock": True
            }
        
        try:
            verification = self.client.verify.v2.services(self.verify_service_sid) \
                .verifications.create(to=phone, channel="sms")
            
            logger.info(f"OTP sent via Twilio Verify to {phone}: {verification.status}")
            
            return {
                "success": True,
                "status": verification.status,
                "message": "OTP sent successfully",
                "mock": False
            }
        
        except Exception as e:
            logger.error(f"Failed to send OTP via Twilio: {str(e)}")
            raise Exception(f"Failed to send OTP: {str(e)}")
    
    async def verify_otp_via_verify(self, phone: str, code: str) -> bool:
        """
        Verify OTP using Twilio Verify API
        """
        if not self.is_configured or not self.verify_service_sid:
            # Mock mode - accept any 6-digit code for testing
            logger.info(f"MOCK MODE: Verifying OTP for {phone}")
            return len(code) == 6 and code.isdigit()
        
        try:
            check = self.client.verify.v2.services(self.verify_service_sid) \
                .verification_checks.create(to=phone, code=code)
            
            is_valid = check.status == "approved"
            logger.info(f"OTP verification for {phone}: {check.status}")
            
            return is_valid
        
        except Exception as e:
            logger.error(f"Failed to verify OTP: {str(e)}")
            return False
    
    async def send_otp_via_sms(self, phone: str, otp: str = None) -> dict:
        """
        Send OTP using standard Twilio SMS API
        You manage OTP generation and storage
        """
        if not self.is_configured or not self.from_phone:
            # Mock mode
            otp = otp or self.generate_otp()
            logger.info(f"MOCK MODE: OTP for {phone}: {otp}")
            return {
                "success": True,
                "otp": otp,
                "message": "OTP sent successfully (mock mode)",
                "mock": True
            }
        
        try:
            otp = otp or self.generate_otp()
            message_body = f"Your HyperServe verification code is: {otp}. Valid for 5 minutes."
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_phone,
                to=phone
            )
            
            logger.info(f"SMS sent to {phone}: {message.sid}")
            
            return {
                "success": True,
                "otp": otp,  # Return for storage in your system
                "message_sid": message.sid,
                "status": message.status,
                "mock": False
            }
        
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {str(e)}")
            raise Exception(f"Failed to send SMS: {str(e)}")


# Create singleton instance
sms_service = SMSService()


async def send_otp(phone: str) -> dict:
    """
    Send OTP to phone number
    Automatically uses Twilio Verify if configured, otherwise falls back to mock mode
    """
    return await sms_service.send_otp_via_verify(phone)


async def verify_otp(phone: str, code: str) -> bool:
    """
    Verify OTP for phone number
    """
    return await sms_service.verify_otp_via_verify(phone, code)
