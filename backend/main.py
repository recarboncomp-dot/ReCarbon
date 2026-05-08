from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
from pathlib import Path

from database import Base, ContactSubmission


BASE_DIR = Path(__file__).resolve().parent.parent
INDEX_HTML = BASE_DIR / "index.html"
DASHBOARD_HTML = BASE_DIR / "dashboard.html"
FRONTEND_DIR = BASE_DIR / "frontend"

# ============================================================
# DATABASE SETUP
# ============================================================
DATABASE_URL = "sqlite:///./contact_form.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# ============================================================
# FASTAPI APP
# ============================================================
app = FastAPI(
    title="Recarbon API",
    description="Form submission API for Recarbon",
    version="1.0.0"
)

# ============================================================
# CORS MIDDLEWARE
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# STATIC FILES
# ============================================================
app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend")

# ============================================================
# PYDANTIC MODELS
# ============================================================
class ContactFormCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    company: str = ""
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com",
                "company": "Tech Corp",
                "message": "I'm interested in your services."
            }
        }


class ContactFormResponse(ContactFormCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# DEPENDENCY
# ============================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# ENDPOINTS
# ============================================================

@app.post("/api/contact/", response_model=dict)
async def submit_contact_form(form_data: ContactFormCreate, db: Session = Depends(get_db)):
    """
    Submit a contact form. Validates and saves form data to database.
    """
    try:
        # Validate required fields
        if not form_data.first_name or len(form_data.first_name.strip()) < 2:
            return {
                "success": False,
                "message": "First name must be at least 2 characters.",
                "errors": {"first_name": [{"message": "First name must be at least 2 characters."}]}
            }
        
        if not form_data.last_name or len(form_data.last_name.strip()) < 2:
            return {
                "success": False,
                "message": "Last name must be at least 2 characters.",
                "errors": {"last_name": [{"message": "Last name must be at least 2 characters."}]}
            }
        
        if not form_data.message or len(form_data.message.strip()) < 10:
            return {
                "success": False,
                "message": "Message must be at least 10 characters.",
                "errors": {"message": [{"message": "Message must be at least 10 characters."}]}
            }
        
        # Create database entry
        db_submission = ContactSubmission(
            first_name=form_data.first_name.strip(),
            last_name=form_data.last_name.strip(),
            email=form_data.email,
            company=form_data.company.strip() if form_data.company else "",
            message=form_data.message.strip(),
            created_at=datetime.utcnow()
        )
        
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        
        return {
            "success": True,
            "message": "Form submitted successfully!",
            "data": {
                "id": db_submission.id,
                "first_name": db_submission.first_name,
                "last_name": db_submission.last_name,
                "email": db_submission.email,
                "company": db_submission.company,
                "message": db_submission.message,
                "created_at": db_submission.created_at.isoformat()
            }
        }
    
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Error submitting form: {str(e)}",
            "errors": {}
        }
    finally:
        db.close()


@app.get("/api/contact/", response_model=dict)
async def get_all_submissions():
    """
    Retrieve all form submissions from the database (for dashboard).
    """
    db = SessionLocal()
    try:
        submissions = db.query(ContactSubmission).order_by(ContactSubmission.created_at.desc()).all()
        
        data = []
        for submission in submissions:
            data.append({
                "id": submission.id,
                "first_name": submission.first_name,
                "last_name": submission.last_name,
                "email": submission.email,
                "company": submission.company,
                "message": submission.message,
                "created_at": submission.created_at.isoformat()
            })
        
        return {
            "success": True,
            "total": len(data),
            "data": data
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error retrieving submissions: {str(e)}",
            "data": []
        }
    finally:
        db.close()


@app.get("/", include_in_schema=False)
async def root():
    """Serve the main website."""
    return FileResponse(INDEX_HTML)


@app.get("/index.html", include_in_schema=False)
async def index_page():
    """Serve the main website entry page."""
    return FileResponse(INDEX_HTML)


@app.get("/dashboard.html", include_in_schema=False)
async def dashboard_page():
    """Serve the live dashboard page."""
    return FileResponse(DASHBOARD_HTML)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
