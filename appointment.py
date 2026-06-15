"""
CRUD operations for Appointment model.
"""

from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.clinic import Clinic
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.utils.pagination import paginate


def create_appointment(db: Session, appointment_data: AppointmentCreate, patient_id: int) -> Appointment:
    """Create a new appointment."""
    db_appointment = Appointment(
        patient_id=patient_id,
        clinic_id=appointment_data.clinic_id,
        appointment_date=appointment_data.appointment_date,
        appointment_time=appointment_data.appointment_time,
        patient_name=appointment_data.patient_name,
        email=appointment_data.email,
        phone=appointment_data.phone,
        service_name=appointment_data.service_name,
        notes=appointment_data.notes,
        status=AppointmentStatus.PENDING,
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def get_appointment(db: Session, appointment_id: int) -> Optional[Appointment]:
    """Get a single appointment by ID."""
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()


def get_appointments_by_patient(db: Session, patient_id: int, page: int = 1, size: int = 10) -> dict:
    """Get all appointments for a patient (paginated)."""
    query = (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient_id)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
    )
    return paginate(query, page, size)


def get_appointments_by_clinic(db: Session, clinic_id: int, page: int = 1, size: int = 10) -> dict:
    """Get all appointments for a clinic (paginated)."""
    query = (
        db.query(Appointment)
        .filter(Appointment.clinic_id == clinic_id)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
    )
    return paginate(query, page, size)


def get_appointments_by_owner(db: Session, owner_id: int, page: int = 1, size: int = 100) -> dict:
    """Get all appointments across all clinics owned by a user (paginated)."""
    # Get all clinic IDs owned by this user
    owned_clinic_ids = [
        c.id for c in db.query(Clinic).filter(Clinic.owner_id == owner_id, Clinic.is_active == True).all()
    ]
    if not owned_clinic_ids:
        return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}

    query = (
        db.query(Appointment)
        .filter(Appointment.clinic_id.in_(owned_clinic_ids))
        .order_by(Appointment.created_at.desc())
    )
    return paginate(query, page, size)


def get_all_appointments(db: Session, page: int = 1, size: int = 10) -> dict:
    """Get all appointments (admin only, paginated)."""
    query = db.query(Appointment).order_by(Appointment.created_at.desc())
    return paginate(query, page, size)


def update_appointment(db: Session, appointment: Appointment, appointment_data: AppointmentUpdate) -> Appointment:
    """Update/reschedule an appointment."""
    update_data = appointment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


def update_appointment_status(db: Session, appointment: Appointment, status: AppointmentStatus) -> Appointment:
    """Update appointment status (approve, reject, complete, cancel)."""
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    return appointment


def delete_appointment(db: Session, appointment: Appointment) -> None:
    """Delete an appointment."""
    db.delete(appointment)
    db.commit()
