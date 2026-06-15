"""
CRUD operations for Review model.
"""

from typing import Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.review import Review
from app.schemas.review import ReviewCreate


def create_review(db: Session, review_data: ReviewCreate, patient_id: int) -> Review:
    """Create a new clinic review."""
    db_review = Review(
        patient_id=patient_id,
        clinic_id=review_data.clinic_id,
        rating=review_data.rating,
        review_text=review_data.review_text,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


def get_reviews_by_clinic(db: Session, clinic_id: int) -> List[Review]:
    """Get all reviews for a specific clinic."""
    return (
        db.query(Review)
        .filter(Review.clinic_id == clinic_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def get_review_by_patient_and_clinic(
    db: Session, patient_id: int, clinic_id: int
) -> Optional[Review]:
    """Check if a patient already reviewed a clinic."""
    return (
        db.query(Review)
        .filter(Review.patient_id == patient_id, Review.clinic_id == clinic_id)
        .first()
    )


def get_clinic_average_rating(db: Session, clinic_id: int) -> Optional[float]:
    """Calculate average rating for a clinic."""
    result = db.query(func.avg(Review.rating)).filter(Review.clinic_id == clinic_id).scalar()
    return round(float(result), 2) if result else None


def get_clinic_review_count(db: Session, clinic_id: int) -> int:
    """Get the number of reviews for a clinic."""
    return db.query(Review).filter(Review.clinic_id == clinic_id).count()
