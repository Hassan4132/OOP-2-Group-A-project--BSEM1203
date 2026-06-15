"""
CRUD operations for Service model.
"""

from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate


def create_service(db: Session, service_data: ServiceCreate) -> Service:
    """Create a new clinic service."""
    db_service = Service(
        clinic_id=service_data.clinic_id,
        service_name=service_data.service_name,
        description=service_data.description,
        price=service_data.price,
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service


def get_service(db: Session, service_id: int) -> Optional[Service]:
    """Get a single service by ID."""
    return db.query(Service).filter(Service.id == service_id).first()


def get_services(db: Session, clinic_id: Optional[int] = None) -> List[Service]:
    """Get all services, optionally filtered by clinic."""
    query = db.query(Service)
    if clinic_id:
        query = query.filter(Service.clinic_id == clinic_id)
    return query.order_by(Service.service_name).all()


def update_service(db: Session, service: Service, service_data: ServiceUpdate) -> Service:
    """Update service information."""
    update_data = service_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service: Service) -> None:
    """Delete a service permanently."""
    db.delete(service)
    db.commit()
