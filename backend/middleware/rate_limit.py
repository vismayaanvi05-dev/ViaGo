"""
Rate Limiting Middleware for FastAPI
Prevents API abuse and DDoS attacks
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with in-memory storage
    For production, consider Redis-based rate limiting
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.client_requests = defaultdict(list)
        self.cleanup_task = None
        
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health check endpoints
        if request.url.path in ["/api/health", "/health", "/", "/api/docs", "/api/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"
        
        # Check rate limit
        current_time = datetime.now()
        
        # Clean old requests for this client
        self.client_requests[client_ip] = [
            req_time for req_time in self.client_requests[client_ip]
            if current_time - req_time < timedelta(seconds=self.window_seconds)
        ]
        
        # Check if rate limit exceeded
        if len(self.client_requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute allowed.",
                headers={"Retry-After": "60"}
            )
        
        # Add current request
        self.client_requests[client_ip].append(current_time)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            self.requests_per_minute - len(self.client_requests[client_ip])
        )
        response.headers["X-RateLimit-Reset"] = str(int(
            (current_time + timedelta(seconds=self.window_seconds)).timestamp()
        ))
        
        return response
    
    async def cleanup_old_entries(self):
        """
        Periodically clean up old entries to prevent memory leaks
        """
        while True:
            await asyncio.sleep(300)  # Run every 5 minutes
            current_time = datetime.now()
            
            # Remove clients with no recent requests
            clients_to_remove = []
            for client_ip, requests in self.client_requests.items():
                # Filter out old requests
                recent_requests = [
                    req_time for req_time in requests
                    if current_time - req_time < timedelta(seconds=self.window_seconds)
                ]
                
                if recent_requests:
                    self.client_requests[client_ip] = recent_requests
                else:
                    clients_to_remove.append(client_ip)
            
            # Clean up empty clients
            for client_ip in clients_to_remove:
                del self.client_requests[client_ip]


class StrictRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Stricter rate limiting for sensitive endpoints (auth, OTP)
    """
    
    def __init__(self, app, requests_per_minute: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.client_requests = defaultdict(list)
        
    async def dispatch(self, request: Request, call_next):
        # Only apply to auth endpoints
        if not request.url.path.startswith("/api/auth"):
            return await call_next(request)
        
        client_ip = request.client.host if request.client else "unknown"
        current_time = datetime.now()
        
        # Clean old requests
        self.client_requests[client_ip] = [
            req_time for req_time in self.client_requests[client_ip]
            if current_time - req_time < timedelta(seconds=self.window_seconds)
        ]
        
        # Check if rate limit exceeded
        if len(self.client_requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Please try again in 1 minute.",
                headers={"Retry-After": "60"}
            )
        
        # Add current request
        self.client_requests[client_ip].append(current_time)
        
        response = await call_next(request)
        return response
