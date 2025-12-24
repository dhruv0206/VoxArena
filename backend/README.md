# VoxArena Backend

FastAPI backend for VoxArena Voice Agent Platform.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **PostgreSQL** - Database
- **LiveKit** - Real-time voice communication

## Setup

### 1. Install dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Unix)
source venv/bin/activate

# Install dependencies
pip install -e .
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database and LiveKit credentials
```

### 3. Set up database

```bash
# Create the database in PostgreSQL first
createdb voxarena

# Run migrations
alembic upgrade head
```

### 4. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app
│   ├── config.py        # Settings
│   ├── database.py      # SQLAlchemy setup
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   └── routers/
│       ├── agents.py    # Agent CRUD
│       ├── sessions.py  # Voice sessions
│       └── livekit.py   # LiveKit integration
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── alembic.ini
├── pyproject.toml
└── .env.example
```
