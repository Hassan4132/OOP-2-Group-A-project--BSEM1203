"""
FastAPI dependencies for authentication and role-based access control.
"""

from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import decode_access_token
from app.models.user import User, UserRole

# OAuth2 scheme — expects token in "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates the current user from the JWT token.
    Raises 401 if the token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that ensures the current user account is active.
    Raises 403 if the account is deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return current_user


class RoleChecker:
    """
    Dependency class for role-based access control.

    Usage:
        @router.post("/clinics", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.CLINIC_OWNER]))])
        async def create_clinic(...):
            ...

    Or as a parameter:
        current_user: User = Depends(RoleChecker([UserRole.ADMIN]))
    """

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}",
            )
        return current_user
