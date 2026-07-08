"""Utilities for building secure, shareable invite URLs."""
import secrets

from app.core.config import settings


def generate_invite_url(meeting_code: str) -> str:
    """
    Build an invite URL for a meeting code, appended with a short random
    security token so the link cannot be trivially guessed even if the
    meeting code pattern is known.
    """
    token = secrets.token_urlsafe(8)
    base = settings.INVITE_BASE_URL.rstrip("/")
    return f"{base}/{meeting_code}?token={token}"
