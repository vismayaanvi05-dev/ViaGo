"""
Email Service for sending OTPs via Resend
Professional email templates for authentication
"""
import os
import asyncio
import logging
import resend
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    """
    Handles email sending via Resend
    Supports OTP emails with professional templates
    """
    
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.sender_email = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")
        self.sender_name = os.getenv("SENDER_NAME", "HyperServe")
        
        # Check if Resend is configured
        self.is_configured = bool(self.api_key)
        
        if self.is_configured:
            resend.api_key = self.api_key
            logger.info("Resend email service initialized")
        else:
            logger.warning("Resend not configured - using mock email mode")
    
    def get_otp_email_template(self, otp: str, recipient_name: str = "User") -> str:
        """
        Generate professional HTML email template for OTP
        """
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - HyperServe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">ViaGo</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your Local Commerce Platform</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1F2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Verify Your Email</h2>
                            <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                                Hi {recipient_name},
                            </p>
                            <p style="color: #6B7280; margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">
                                Use the verification code below to complete your registration. This code will expire in <strong>5 minutes</strong>.
                            </p>
                            
                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 24px; background-color: #F9FAFB; border-radius: 8px; border: 2px dashed #E5E7EB;">
                                        <div style="font-size: 36px; font-weight: bold; color: #8B5CF6; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            {otp}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #6B7280; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6;">
                                If you didn't request this code, please ignore this email or contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; background-color: #F9FAFB; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="color: #9CA3AF; margin: 0; font-size: 13px;">
                                © {datetime.now().year} HyperServe. All rights reserved.
                            </p>
                            <p style="color: #9CA3AF; margin: 8px 0 0 0; font-size: 13px;">
                                Your trusted local commerce platform
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Disclaimer -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                    <tr>
                        <td style="text-align: center; padding: 16px;">
                            <p style="color: #9CA3AF; margin: 0; font-size: 12px; line-height: 1.5;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
    
    async def send_otp_email(self, email: str, otp: str, recipient_name: str = "User") -> dict:
        """
        Send OTP via email using Resend
        """
        if not self.is_configured:
            # Mock mode for development
            logger.info(f"MOCK MODE: OTP email for {email}: {otp}")
            return {
                "success": True,
                "otp": otp,  # Only for testing/mock mode
                "message": "OTP email sent successfully (mock mode)",
                "mock": True
            }
        
        try:
            html_content = self.get_otp_email_template(otp, recipient_name)
            
            params = {
                "from": f"{self.sender_name} <{self.sender_email}>",
                "to": [email],
                "subject": f"Your ViaGo verification code: {otp}",
                "html": html_content
            }
            
            # Use asyncio.to_thread to make sync SDK call non-blocking
            response = await asyncio.to_thread(resend.Emails.send, params)
            
            logger.info(f"OTP email sent to {email}: {response.get('id')}")
            
            return {
                "success": True,
                "message": "OTP email sent successfully",
                "email_id": response.get("id"),
                "mock": False
            }
        
        except Exception as e:
            logger.error(f"Failed to send OTP email via Resend: {str(e)}")
            raise Exception(f"Failed to send email: {str(e)}")
    
    async def send_welcome_email(self, email: str, name: str) -> dict:
        """
        Send welcome email to new users
        """
        if not self.is_configured:
            logger.info(f"MOCK MODE: Welcome email for {email}")
            return {"success": True, "mock": True}
        
        try:
            html_content = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #8B5CF6;">Welcome to HyperServe! 🎉</h1>
        <p>Hi {name},</p>
        <p>Thank you for joining HyperServe - your local commerce platform!</p>
        <p>You can now:</p>
        <ul>
            <li>Browse local stores and restaurants</li>
            <li>Order food, groceries, and laundry services</li>
            <li>Track your orders in real-time</li>
            <li>Save your favorite stores</li>
        </ul>
        <p>Get started by exploring stores near you!</p>
        <p>Best regards,<br>The HyperServe Team</p>
    </div>
</body>
</html>
            """
            
            params = {
                "from": f"{self.sender_name} <{self.sender_email}>",
                "to": [email],
                "subject": "Welcome to HyperServe! 🎉",
                "html": html_content
            }
            
            response = await asyncio.to_thread(resend.Emails.send, params)
            
            logger.info(f"Welcome email sent to {email}")
            
            return {
                "success": True,
                "email_id": response.get("id"),
                "mock": False
            }
        
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
            return {"success": False, "error": str(e)}


# Create singleton instance
email_service = EmailService()


async def send_otp_email(email: str, otp: str, name: str = "User") -> dict:
    """
    Send OTP email
    """
    return await email_service.send_otp_email(email, otp, name)


async def send_welcome_email(email: str, name: str) -> dict:
    """
    Send welcome email
    """
    return await email_service.send_welcome_email(email, name)
