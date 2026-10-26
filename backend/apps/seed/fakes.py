"""Small generators of fake contact data."""

import random
import re
import unicodedata
from datetime import datetime, timedelta

from django.utils import timezone


def random_phone(random_generator: random.Random) -> str:
    return f"(11) 9{random_generator.randint(1000, 9999)}-{random_generator.randint(1000, 9999)}"


def random_past_datetime(
    random_generator: random.Random, max_days_ago: int
) -> datetime:
    return timezone.now() - timedelta(
        days=random_generator.randint(1, max_days_ago),
        hours=random_generator.randint(0, 23),
    )


def email_slug(name: str) -> str:
    """ASCII, dot-separated, at most 24 characters: always a valid e-mail local part."""
    ascii_name = (
        unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    )
    without_suffix = re.sub(r"\b(ltda|s\.a\.)", "", ascii_name)
    words = [word for word in re.split(r"[^a-z0-9]+", without_suffix) if word]
    return ".".join(words)[:24].strip(".")
