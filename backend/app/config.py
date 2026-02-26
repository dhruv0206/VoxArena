from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    postgres_password: str = ""
    database_url: str = ""
    db_host: str = "localhost"

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

    # LiveKit SIP
    livekit_sip_trunk_id: str = ""  # Outbound SIP trunk ID for call transfers

    # Server
    port: int = 8000
    debug: bool = True

    # CORS — comma-separated origins, e.g. "http://localhost:3000,https://voxarena.onrender.com"
    frontend_url: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse frontend_url into a list of allowed origins."""
        return [u.strip() for u in self.frontend_url.split(",") if u.strip()]

    @model_validator(mode="after")
    def build_database_url(self):
        if not self.database_url:
            self.database_url = f"postgresql://postgres:{self.postgres_password}@{self.db_host}:5432/voxarena"
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
