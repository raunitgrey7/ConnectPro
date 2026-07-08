"""Utilities for generating human-friendly, unique meeting identifiers."""
import random
import string

_ALPHABET = string.ascii_lowercase + string.digits


def generate_meeting_code(length: int = 10, segment_size: int = 3) -> str:
    """
    Generate a Zoom-style meeting code, e.g. 'abc-defg-hij'.

    The code is segmented with hyphens purely for readability; uniqueness is
    still enforced at the database layer (unique constraint) and re-checked
    by the repository/service layer with a retry loop.
    """
    raw = "".join(random.choices(_ALPHABET, k=length))
    segments = [raw[i : i + segment_size] for i in range(0, len(raw), segment_size)]
    return "-".join(segments)
