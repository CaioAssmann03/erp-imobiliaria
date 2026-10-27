"""The list search by ID (spec 019, R5): `QuerySearchFilter` with `search_code_field`."""

import pytest

from apps.core.infrastructure.search.term import code_from_term



@pytest.mark.parametrize(
    ("term", "code"),
    [
        ("7", 7),
        ("0042", 42),
        ("123456789012345678", 123456789012345678),
        ("1234567890123456789", None),
        ("12.3", None),
        ("-5", None),
        ("abc", None),
        ("", None),
        ("١٢", None),
    ],
)
def test_only_a_short_ascii_digit_term_is_an_id(term: str, code: int | None) -> None:
    assert code_from_term(term) == code
