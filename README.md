# Clinic Service API

A production-ready RESTful backend for clinic search, appointment booking, and clinic management built with **FastAPI**, **PostgreSQL**, **SQLAlchemy**, and **JWT authentication**.

## Features

- **Authentication** — Register, Login, JWT tokens, Role-Based Access Control (Admin, Clinic Owner, Patient)
- **Clinic Management** — Full CRUD with image uploads and location data
- **Clinic Search** — Search by name, district, city, service type, doctor specialty
- **Services Management** — CRUD for clinic services (Dental, Eye Care, Lab, etc.)
- **Appointment Booking** — Book, reschedule, cancel with conflict detection and status workflow
- **Reviews & Ratings** — Patient reviews with 1-5 star ratings and automatic average calculation

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Validation | Pydantic v2 |
| Python | 3.12+ |

## Project Structure

```
clinic_service_api/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py           # SQLAlchemy engine & session
│   ├── config/
│   │   └── settings.py       # Pydantic BaseSettings
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── clinic.py
│   │   ├── service.py
│   │   ├── appointment.py
│   │   └── review.py
│   ├── schemas/              # Pydantic validation schemas
│   │   ├── common.py
│   │   ├── user.py
│   │   ├── clinic.py
│   │   ├── service.py
│   │   ├── appointment.py
│   │   └── review.py
│   ├── crud/                 # Database CRUD operations
│   │   ├── user.py
│   │   ├── clinic.py
│   │   ├── service.py
│   │   ├── appointment.py
│   │   └── review.py
│   ├── routers/              # API route handlers
│   │   ├── auth.py
│   │   ├── clinics.py
│   │   ├── search.py
│   │   ├── services.py
│   │   ├── appointments.py
│   │   └── reviews.py
│   ├── services/             # Business logic layer
│   │   ├── appointment_service.py
│   │   └── clinic_service.py
│   ├── auth/                 # Authentication system
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── middleware/
│   │   └── logging.py
│   ├── utils/
│   │   ├── exceptions.py
│   │   ├── pagination.py
│   │   └── logger.py
│   └── uploads/              # Clinic image uploads
├── alembic/                  # Database migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── alembic.ini
├── requirements.txt
├── .env
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL 14+

### 1. Clone & Setup Virtual Environment

```bash
cd clinic_service_api

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Edit the `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clinic_service_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Create the Database

```sql
-- In PostgreSQL
CREATE DATABASE clinic_service_db;
```

### 5. Run Database Migrations

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Start the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API docs:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/profile` | Get current user profile |

### Clinics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clinics` | List all clinics (paginated) |
| GET | `/api/clinics/{id}` | Get clinic details |
| POST | `/api/clinics` | Create a clinic (owner/admin) |
| PUT | `/api/clinics/{id}` | Update clinic (owner/admin) |
| DELETE | `/api/clinics/{id}` | Delete clinic (owner/admin) |
| POST | `/api/clinics/{id}/upload-image` | Upload clinic image |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?district=Western Area` | Search by district |
| GET | `/api/search?service=Dental` | Search by service |
| GET | `/api/search?city=Freetown` | Search by city |
| GET | `/api/search?name=Health&city=Freetown` | Combined search |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| GET | `/api/services/{id}` | Get service details |
| POST | `/api/services` | Create service (owner/admin) |
| PUT | `/api/services/{id}` | Update service (owner/admin) |
| DELETE | `/api/services/{id}` | Delete service (owner/admin) |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment (patient) |
| GET | `/api/appointments` | List appointments |
| GET | `/api/appointments/{id}` | Get appointment details |
| PUT | `/api/appointments/{id}` | Reschedule appointment |
| PATCH | `/api/appointments/{id}/status` | Update status (approve/reject/complete) |
| DELETE | `/api/appointments/{id}` | Cancel appointment |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit review (patient) |
| GET | `/api/reviews/{clinic_id}` | Get clinic reviews |

## User Roles

| Role | Permissions |
|------|------------|
| **admin** | Full access to all resources |
| **clinic_owner** | Manage own clinics, services, and appointments |
| **patient** | Book appointments, leave reviews |

## Appointment Status Workflow

```
PENDING → APPROVED → COMPLETED
    ↓         ↓
REJECTED   CANCELLED
    ↓
(terminal)
```

## License

This project is licensed under the MIT License.
![Uploading image.png…]()

