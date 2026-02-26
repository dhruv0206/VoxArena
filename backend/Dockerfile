# VoxArena Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy everything and install (non-editable for production reliability)
COPY . .
RUN pip install --no-cache-dir .

# Expose port
EXPOSE 8000

# Create startup script with debug output
RUN echo '#!/bin/bash\n\
set -e\n\
echo "=== VoxArena Backend Startup ==="\n\
echo "PORT=${PORT:-8000}"\n\
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo YES || echo NO)"\n\
echo "DB_HOST=${DB_HOST:-not set}"\n\
\n\
# Wait for database if DB_HOST is set (Docker Compose mode)\n\
if [ -n "$DB_HOST" ]; then\n\
    echo "Waiting for PostgreSQL at $DB_HOST..."\n\
    while ! nc -z $DB_HOST 5432; do sleep 1; done\n\
    echo "PostgreSQL ready!"\n\
fi\n\
\n\
# Test database connection before migrations\n\
echo "Testing database connection..."\n\
python -c "\n\
from sqlalchemy import create_engine, text\n\
from app.config import get_settings\n\
s = get_settings()\n\
engine = create_engine(s.database_url)\n\
with engine.connect() as conn:\n\
    conn.execute(text('"'"'SELECT 1'"'"'))\n\
print(f'"'"'DB connected: {s.database_url[:40]}...'"'"')\n\
" || { echo "DATABASE CONNECTION FAILED"; exit 1; }\n\
\n\
echo "Running Alembic migrations..."\n\
alembic upgrade head\n\
\n\
echo "Starting server on port ${PORT:-8000}..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}\n\
' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
