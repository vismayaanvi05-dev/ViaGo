import resend
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Initialize Resend with API key
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
resend.api_key = RESEND_API_KEY

# Email sender configuration
FROM_EMAIL = "ViaGo <onboarding@resend.dev>"  # Using Resend's default domain for testing
APP_NAME = "ViaGo"

async def send_otp_email(to_email: str, otp: str) -> dict:
    """
    Send OTP verification email to customer
    """
    try:
        if not RESEND_API_KEY:
            logger.warning("Resend API key not configured, skipping email")
            return {"success": False, "error": "Email service not configured"}
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 48px;">🚗</span>
                        <h1 style="color: #1f2937; font-size: 24px; margin: 16px 0 8px 0;">{APP_NAME}</h1>
                        <p style="color: #6b7280; margin: 0;">Your complete delivery solution</p>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">Your verification code is:</p>
                        <div style="background: linear-gradient(135deg, #8B5CF6, #EC4899); border-radius: 12px; padding: 24px; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px;">{otp}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">This code expires in 5 minutes</p>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            If you didn't request this code, you can safely ignore this email.
                        </p>
                    </div>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                    © 2025 {APP_NAME}. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        {APP_NAME} - Email Verification
        
        Your verification code is: {otp}
        
        This code expires in 5 minutes.
        
        If you didn't request this code, you can safely ignore this email.
        """
        
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Your {APP_NAME} verification code: {otp}",
            "html": html_content,
            "text": text_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"OTP email sent to {to_email}, response: {response}")
        
        return {"success": True, "message_id": response.get("id")}
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_welcome_email(to_email: str, name: str) -> dict:
    """
    Send welcome email to new customer after registration
    """
    try:
        if not RESEND_API_KEY:
            logger.warning("Resend API key not configured, skipping email")
            return {"success": False, "error": "Email service not configured"}
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 48px;">🎉</span>
                        <h1 style="color: #1f2937; font-size: 24px; margin: 16px 0 8px 0;">Welcome to {APP_NAME}!</h1>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi {name},</p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Thank you for joining {APP_NAME}! We're excited to have you on board.
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        With {APP_NAME}, you can:
                    </p>
                    
                    <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
                        <li>🍔 Order delicious food from nearby restaurants</li>
                        <li>🛒 Get groceries delivered to your doorstep</li>
                        <li>👕 Schedule laundry pickup and delivery</li>
                    </ul>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Start exploring now and enjoy your first order!
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            Need help? Contact our support team anytime.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Welcome to {APP_NAME}! 🎉",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Welcome email sent to {to_email}")
        
        return {"success": True, "message_id": response.get("id")}
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_driver_credentials_email(to_email: str, name: str, password: str) -> dict:
    """
    Send login credentials email to new driver (created by admin)
    """
    try:
        if not RESEND_API_KEY:
            logger.warning("Resend API key not configured, skipping email")
            return {"success": False, "error": "Email service not configured"}
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 48px;">🚴</span>
                        <h1 style="color: #1f2937; font-size: 24px; margin: 16px 0 8px 0;">Welcome to {APP_NAME} Driver!</h1>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi {name},</p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Your driver account has been created. Here are your login credentials:
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 12px 0;"><strong style="color: #374151;">Email:</strong> <span style="color: #10B981;">{to_email}</span></p>
                        <p style="margin: 0;"><strong style="color: #374151;">Password:</strong> <span style="color: #10B981;">{password}</span></p>
                    </div>
                    
                    <p style="color: #EF4444; font-size: 14px; line-height: 1.6;">
                        ⚠️ Please change your password after your first login for security.
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Download the {APP_NAME} Driver app and start earning today!
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            If you didn't expect this email, please contact your administrator.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Your {APP_NAME} Driver Account Credentials",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Driver credentials email sent to {to_email}")
        
        return {"success": True, "message_id": response.get("id")}
        
    except Exception as e:
        logger.error(f"Failed to send driver credentials email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}
