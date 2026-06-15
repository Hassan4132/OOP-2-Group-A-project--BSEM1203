"""
CRUD operations for User model.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.auth.security import hash_password


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get a user by their ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by their email address."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Create a new user with hashed password.

    Args:
        db: Database session.
        user_data: User registration data.

    Returns:
        Created User instance.
    """
    db_user = User(
        fullname=user_data.fullname,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        phone=user_data.phone,
        role=user_data.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user: User, user_data: UserUpdate) -> User:
    """
    Update user profile fields.

    Args:
        db: Database session.
        user: Existing user instance.
        user_data: Fields to update.

    Returns:
        Updated User instance.
    """
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
