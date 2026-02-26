# VoxArena Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency file
COPY pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database if DB_HOST is set (Docker mode)\n\
if [ -n "$DB_HOST" ]; then\n\
    echo "Waiting for PostgreSQL at $DB_HOST..."\n\
    while ! nc -z $DB_HOST 5432; do sleep 1; done\n\
    echo "PostgreSQL ready!"\n\
fi\n\
\n\
echo "Running Alembic migrations..."\n\
alembic upgrade head\n\
\n\
echo "Starting server..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}\n\
' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
