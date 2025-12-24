from fastapi import APIRouter, HTTPException
from livekit.api import AccessToken, VideoGrants

from app.config import get_settings
from app.schemas import TokenRequest, TokenResponse

router = APIRouter()
settings = get_settings()


@router.post("/token", response_model=TokenResponse)
async def generate_token(request: TokenRequest):
    """Generate a LiveKit access token for a user to join a room."""
    if not settings.livekit_api_key or not settings.livekit_api_secret:
        raise HTTPException(status_code=500, detail="LiveKit not configured")
    
    token = AccessToken(
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret,
    )
    token.identity = request.user_id
    token.name = request.user_name or request.user_id
    token.ttl = 600  # 10 minutes
    
    token.add_grant(
        VideoGrants(
            room=request.room_name,
            room_join=True,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )
    )
    
    jwt_token = token.to_jwt()
    
    return TokenResponse(
        token=jwt_token,
        ws_url=settings.livekit_url,
        room_name=request.room_name,
    )


@router.post("/webhook")
async def livekit_webhook(event: dict):
    """Handle LiveKit webhook events."""
    event_type = event.get("event")
    
    match event_type:
        case "room_started":
            print(f"Room started: {event.get('room', {}).get('name')}")
        case "room_finished":
            print(f"Room finished: {event.get('room', {}).get('name')}")
        case "participant_joined":
            print(f"Participant joined: {event.get('participant', {}).get('identity')}")
        case "participant_left":
            print(f"Participant left: {event.get('participant', {}).get('identity')}")
        case _:
            print(f"Unknown event: {event_type}")
    
    return {"status": "ok"}
