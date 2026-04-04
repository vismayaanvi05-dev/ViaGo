from fastapi import Header, HTTPException, status
from jose import JWTError, jwt
from typing import Optional
import os

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Extract and verify JWT token from Authorization header
    Returns decoded token payload with user_id, tenant_id, role
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

async def require_role(current_user: dict, allowed_roles: list):
    """
    Check if user has one of the allowed roles
    """
    user_role = current_user.get("role")
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
        )
    return True

async def get_tenant_id(current_user: dict) -> Optional[str]:
    """
    Extract tenant_id from current user
    Returns None for super_admin
    """
    return current_user.get("tenant_id")

async def verify_tenant_access(current_user: dict, resource_tenant_id: str):
    """
    Verify that user has access to resource belonging to tenant
    Super admin can access all tenants
    """
    user_role = current_user.get("role")
    user_tenant_id = current_user.get("tenant_id")
    
    # Super admin has access to all tenants
    if user_role == "super_admin":
        return True
    
    # Regular users can only access their own tenant's resources
    if user_tenant_id != resource_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this resource"
        )
    
    return True
