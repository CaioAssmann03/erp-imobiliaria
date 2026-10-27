from datetime import date

import pytest

from apps.core.infrastructure.dates import add_months


@pytest.mark.parametrize(
    ("start_date", "months", "expected"),
    [
        (date(2025, 1, 31), 1, date(2025, 2, 28)),
        (date(2024, 1, 31), 1, date(2024, 2, 29)),
        (date(2025, 11, 15), 3, date(2026, 2, 15)),
        (date(2025, 5, 10), 0, date(2025, 5, 10)),
        (date(2025, 5, 10), 24, date(2027, 5, 10)),
    ],
)
def test_add_months(start_date: date, months: int, expected: date) -> None:
    assert add_months(start_date, months) == expected
