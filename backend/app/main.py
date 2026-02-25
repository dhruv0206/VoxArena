from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import agents, sessions, livekit, telephony, resemble, calls, usage, costs

settings = get_settings()

app = FastAPI(
    title="VoxArena API",
    description="Backend API for VoxArena Voice Agent Platform",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(livekit.router, prefix="/api/livekit", tags=["LiveKit"])
app.include_router(telephony.router, prefix="/api/telephony", tags=["Telephony"])
app.include_router(resemble.router, prefix="/api/resemble", tags=["Resemble"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(usage.router, prefix="/api/usage", tags=["Usage"])
app.include_router(costs.router, prefix="/api/costs", tags=["Costs"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "voxarena-api"}


@app.get("/")
async def root():
    return {"message": "Welcome to VoxArena API", "docs": "/docs"}
