from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/voxarena"
    
    # LiveKit
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = ""
    
    # Resemble AI
    resemble_api_key: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_sip_domain: str = ""  # e.g. voxarena.sip.livekit.cloud

    # Server
    port: int = 8000
    debug: bool = True
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
