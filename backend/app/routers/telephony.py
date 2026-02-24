"""
Telephony Router - Twilio phone number management and SIP integration.
Handles searching, buying, assigning, and releasing Twilio phone numbers for agents.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from app.database import get_db
from app.config import get_settings
from app import models

logger = logging.getLogger("telephony")
router = APIRouter()


# --- Schemas ---

class NumberSearchResult(BaseModel):
    phone_number: str
    friendly_name: str
    locality: Optional[str] = None
    region: Optional[str] = None


class BuyNumberRequest(BaseModel):
    agent_id: str
    phone_number: str  # The number to purchase (from search results)


class BuyNumberResponse(BaseModel):
    phone_number: str
    twilio_sid: str
    agent_id: str


class ReleaseNumberRequest(BaseModel):
    agent_id: str


class AssignNumberRequest(BaseModel):
    agent_id: str
    phone_number: str  # An already-owned Twilio number (E.164 format, e.g. +1234567890)


# --- Endpoints ---

@router.get("/numbers/search", response_model=list[NumberSearchResult])
async def search_available_numbers(
    area_code: Optional[str] = Query(None, description="Area code to search in"),
    country: str = Query("US", description="Country code"),
    limit: int = Query(10, ge=1, le=20),
):
    """Search for available Twilio phone numbers."""
    settings = get_settings()

    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(status_code=500, detail="Twilio credentials not configured")

    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

        search_params = {"limit": limit}
        if area_code:
            search_params["area_code"] = area_code

        available = client.available_phone_numbers(country).local.list(**search_params)

        return [
            NumberSearchResult(
                phone_number=num.phone_number,
                friendly_name=num.friendly_name,
                locality=num.locality,
                region=num.region,
            )
            for num in available
        ]
    except ImportError:
        raise HTTPException(status_code=500, detail="Twilio SDK not installed. Run: pip install twilio")
    except Exception as e:
        logger.error(f"Error searching numbers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search numbers: {str(e)}")


@router.post("/numbers/buy", response_model=BuyNumberResponse)
async def buy_number(
    request: BuyNumberRequest,
    db: Session = Depends(get_db),
):
    """Purchase a Twilio phone number and assign it to an agent."""
    settings = get_settings()

    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise HTTPException(status_code=500, detail="Twilio credentials not configured")

    # Verify agent exists
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if agent already has a number
    if agent.phone_number and agent.twilio_sid:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already has number {agent.phone_number}. Release it first.",
        )

    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

        # Build SIP URI for LiveKit routing
        sip_uri = (
            f"sip:{request.phone_number}@{settings.twilio_sip_domain}"
            if settings.twilio_sip_domain
            else None
        )

        purchase_params = {"phone_number": request.phone_number}

        # If we have a SIP domain, configure SIP routing
        if sip_uri:
            purchase_params["sip_domain_sid"] = None  # Configured separately
            purchase_params["voice_url"] = ""  # Will be set to SIP trunk

        incoming = client.incoming_phone_numbers.create(**purchase_params)

        # Configure number to forward to LiveKit SIP
        if settings.twilio_sip_domain:
            incoming = client.incoming_phone_numbers(incoming.sid).update(
                voice_url=f"https://{settings.twilio_sip_domain}",
            )

        # Update agent record
        agent.phone_number = incoming.phone_number
        agent.twilio_sid = incoming.sid
        db.commit()
        db.refresh(agent)

        logger.info(f"Purchased number {incoming.phone_number} for agent {agent.name}")

        return BuyNumberResponse(
            phone_number=incoming.phone_number,
            twilio_sid=incoming.sid,
            agent_id=agent.id,
        )

    except ImportError:
        raise HTTPException(status_code=500, detail="Twilio SDK not installed. Run: pip install twilio")
    except Exception as e:
        logger.error(f"Error buying number: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to buy number: {str(e)}")


@router.post("/numbers/release")
async def release_number(
    request: ReleaseNumberRequest,
    db: Session = Depends(get_db),
):
    """Release a Twilio phone number from an agent."""
    settings = get_settings()

    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.twilio_sid:
        raise HTTPException(status_code=400, detail="Agent has no assigned phone number")

    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

        # Release the number from Twilio
        client.incoming_phone_numbers(agent.twilio_sid).delete()

        old_number = agent.phone_number
        agent.phone_number = None
        agent.twilio_sid = None
        db.commit()

        logger.info(f"Released number {old_number} from agent {agent.name}")
        return {"status": "released", "phone_number": old_number}

    except ImportError:
        raise HTTPException(status_code=500, detail="Twilio SDK not installed")
    except Exception as e:
        logger.error(f"Error releasing number: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to release number: {str(e)}")


@router.post("/numbers/assign")
async def assign_existing_number(
    request: AssignNumberRequest,
    db: Session = Depends(get_db),
):
    """Assign an already-owned Twilio number to an agent (no purchase)."""
    settings = get_settings()

    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.phone_number and agent.twilio_sid:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already has number {agent.phone_number}. Release it first.",
        )

    # Normalize the number
    phone = request.phone_number.strip()
    if not phone.startswith("+"):
        phone = f"+{phone}"

    # Validate ownership by looking it up in Twilio account
    twilio_sid = None
    if settings.twilio_account_sid and settings.twilio_auth_token:
        try:
            from twilio.rest import Client
            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            numbers = client.incoming_phone_numbers.list(phone_number=phone)
            if numbers:
                twilio_sid = numbers[0].sid
            else:
                logger.warning(f"Number {phone} not found in Twilio account — assigning anyway")
        except Exception as e:
            logger.warning(f"Could not verify number in Twilio: {e} — assigning anyway")

    agent.phone_number = phone
    agent.twilio_sid = twilio_sid  # May be None if Twilio lookup failed
    db.commit()
    db.refresh(agent)

    logger.info(f"Assigned existing number {phone} to agent {agent.name}")
    return {
        "status": "assigned",
        "phone_number": phone,
        "twilio_sid": twilio_sid,
        "agent_id": agent.id,
    }


# --- Utility ---

def normalize_phone(number: str) -> str:
    """Strip all non-digit characters and normalize to E.164.
    Handles US numbers stored without country code (e.g. '(254) 566-4820' → '+12545664820').
    """
    if not number:
        return ""
    digits = "".join(c for c in number if c.isdigit())
    if not digits:
        return ""
    if len(digits) == 10:
        digits = "1" + digits
    return f"+{digits}"


# --- Agent Lookup (used by Agent worker for SIP dispatch) ---

@router.get("/lookup")
async def lookup_agent_by_phone(
    phone_number: str = Query(..., description="The phone number to look up"),
    db: Session = Depends(get_db),
):
    """Look up an agent by its assigned phone number. Used by the agent worker for SIP dispatch."""
    normalized_input = normalize_phone(phone_number)
    logger.info(f"Looking up agent for phone: {phone_number} (normalized: {normalized_input})")

    # Get all agents with a phone number and compare normalized versions
    agents = (
        db.query(models.Agent)
        .filter(models.Agent.phone_number.isnot(None), models.Agent.is_active == True)
        .all()
    )

    for a in agents:
        if normalize_phone(a.phone_number) == normalized_input:
            logger.info(f"Found agent: {a.name} (id={a.id}) for number {phone_number}")
            return {"agent_id": a.id, "name": a.name, "config": a.config}

    raise HTTPException(status_code=404, detail="No agent found for this phone number")
