"""
CRUD operations for Clinic model.
"""

from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.clinic import Clinic
from app.models.review import Review
from app.models.service import Service
from app.schemas.clinic import ClinicCreate, ClinicUpdate
from app.utils.pagination import paginate


def create_clinic(db: Session, clinic_data: ClinicCreate, owner_id: int) -> Clinic:
    """Create a new clinic."""
    db_clinic = Clinic(
        clinic_name=clinic_data.clinic_name,
        description=clinic_data.description,
        district=clinic_data.district,
        city=clinic_data.city,
        address=clinic_data.address,
        phone=clinic_data.phone,
        email=clinic_data.email,
        latitude=clinic_data.latitude,
        longitude=clinic_data.longitude,
        owner_id=owner_id,
    )
    db.add(db_clinic)
    db.commit()
    db.refresh(db_clinic)
    return db_clinic


def get_clinic(db: Session, clinic_id: int) -> Optional[Clinic]:
    """Get a single clinic by ID."""
    return db.query(Clinic).filter(Clinic.id == clinic_id, Clinic.is_active == True).first()


def get_clinics(db: Session, page: int = 1, size: int = 10) -> dict:
    """Get all active clinics with pagination."""
    query = db.query(Clinic).filter(Clinic.is_active == True).order_by(Clinic.created_at.desc())
    return paginate(query, page, size)


def update_clinic(db: Session, clinic: Clinic, clinic_data: ClinicUpdate) -> Clinic:
    """Update clinic information."""
    update_data = clinic_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clinic, field, value)
    db.commit()
    db.refresh(clinic)
    return clinic


def delete_clinic(db: Session, clinic: Clinic) -> None:
    """Soft-delete a clinic by marking it as inactive."""
    clinic.is_active = False
    db.commit()


def search_clinics(
    db: Session,
    name: Optional[str] = None,
    district: Optional[str] = None,
    city: Optional[str] = None,
    service: Optional[str] = None,
    specialty: Optional[str] = None,
    page: int = 1,
    size: int = 10,
) -> dict:
    """
    Search clinics with multiple filter criteria.

    Args:
        db: Database session.
        name: Clinic name (partial match).
        district: District filter.
        city: City filter.
        service: Service type filter (joins services table).
        specialty: Doctor specialty / service name filter.
        page: Page number.
        size: Items per page.

    Returns:
        Paginated results dictionary.
    """
    query = db.query(Clinic).filter(Clinic.is_active == True)

    if name:
        query = query.outerjoin(Service).filter(
            or_(
                Clinic.clinic_name.ilike(f"%{name}%"),
                Service.service_name.ilike(f"%{name}%")
            )
        )
    if district:
        query = query.filter(Clinic.district.ilike(f"%{district}%"))
    if city:
        query = query.filter(Clinic.city.ilike(f"%{city}%"))
    if service:
        query = query.outerjoin(Service).filter(Service.service_name.ilike(f"%{service}%"))
    if specialty:
        query = query.outerjoin(Service).filter(Service.service_name.ilike(f"%{specialty}%"))

    query = query.distinct().order_by(Clinic.clinic_name)
    return paginate(query, page, size)


def get_clinic_average_rating(db: Session, clinic_id: int) -> Optional[float]:
    """Calculate the average rating for a clinic."""
    result = db.query(func.avg(Review.rating)).filter(Review.clinic_id == clinic_id).scalar()
    return round(float(result), 2) if result else None
