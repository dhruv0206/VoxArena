# VoxArena Agent Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency file
COPY pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Pre-download Silero VAD model
RUN python -c "from livekit.plugins import silero; silero.VAD.load()" || true

# Copy application code
COPY . .

# Start the agent
CMD ["python", "agent.py", "start"]
