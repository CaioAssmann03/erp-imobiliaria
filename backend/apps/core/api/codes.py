import re

# Up to 18 digits always fit a bigint (19 digits may not), so a longer term is never an ID.
_ID_TERM = re.compile(r"[0-9]{1,18}")


def code_from_term(term: str) -> int | None:
    """The ID a search term asks for: a term made only of digits; anything else is not an ID."""
    return int(term) if _ID_TERM.fullmatch(term) else None
