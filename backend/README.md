# Recarbon FastAPI Backend

A simple FastAPI backend for managing form submissions with SQLite database.

## Features

- ✅ Form validation
- ✅ SQLite database storage
- ✅ CORS enabled for frontend communication
- ✅ API endpoints for form submission and data retrieval
- ✅ Dashboard data retrieval
- ✅ Website served at /index.html
- ✅ Live dashboard served at /dashboard.html

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python main.py
```

Or use uvicorn directly:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API and pages will be available at `http://127.0.0.1:8000`

## Pages

- Main website: http://127.0.0.1:8000/index.html
- Dashboard: http://127.0.0.1:8000/dashboard.html
- Root URL: http://127.0.0.1:8000/

## API Endpoints

### POST /api/contact/

Submit a contact form.

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "company": "Tech Corp",
  "message": "I'm interested in your services."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Form submitted successfully!",
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "company": "Tech Corp",
    "message": "I'm interested in your services.",
    "created_at": "2024-12-20T10:30:00"
  }
}
```

### GET /api/contact/

Retrieve all form submissions (for dashboard).

**Response:**

```json
{
  "success": true,
  "total": 5,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "company": "Tech Corp",
      "message": "I'm interested in your services.",
      "created_at": "2024-12-20T10:30:00"
    }
  ]
}
```

## Database

The SQLite database file `contact_form.db` is automatically created in the backend folder when you run the server for the first time.

## Validation Rules

- `first_name`: Minimum 2 characters
- `last_name`: Minimum 2 characters
- `email`: Valid email format
- `company`: Optional, minimum 2 characters if provided
- `message`: Minimum 10 characters

## File Structure

```
backend/
├── main.py           # FastAPI app and endpoints
├── database.py       # Database models
├── requirements.txt  # Python dependencies
└── README.md         # This file
```
