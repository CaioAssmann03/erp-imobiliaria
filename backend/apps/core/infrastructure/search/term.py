import re
from typing import NamedTuple

MIN_TEXT_LENGTH = 3  
MIN_NUMERIC_LENGTH = 2  
MIN_DOCUMENT_DIGITS = 3

NUMERIC_TERM = re.compile(r"^[\d.\-/\s]+$")

_ID_TERM = re.compile(r"[0-9]{1,18}")


class ClassifiedTerm(NamedTuple):
    text: str
    is_searchable: bool
    digits: str  
    code: int | None  
    matches_text: bool  
    matches_document: bool


def code_from_term(term: str) -> int | None:
    """The ID a search term asks for: a term made only of digits; anything else is not an ID."""
    return int(term) if _ID_TERM.fullmatch(term) else None


def classify_term(term: str) -> ClassifiedTerm:
    code = code_from_term(term)
    if NUMERIC_TERM.match(term):
        digits = re.sub(r"\D", "", term)
        is_single_digit_id = code is not None and len(digits) < MIN_NUMERIC_LENGTH
        return ClassifiedTerm(
            text=term,
            is_searchable=len(digits) >= MIN_NUMERIC_LENGTH or is_single_digit_id,
            digits=digits,
            code=code,
            matches_text=not is_single_digit_id,
            matches_document=len(digits) >= MIN_DOCUMENT_DIGITS,
        )
    return ClassifiedTerm(
        text=term,
        is_searchable=len(term) >= MIN_TEXT_LENGTH,
        digits="",
        code=None,
        matches_text=True,
        matches_document=False,
    )
