from datetime import date

import pytest
from apps.core.infrastructure.validators import validate_first_day_of_month
from django.core.exceptions import ValidationError


def test_first_day_is_valid() -> None:
    validate_first_day_of_month(date(2026, 10, 1))


@pytest.mark.parametrize("day", [2, 15, 31])
def test_other_days_are_rejected(day: int) -> None:
    with pytest.raises(ValidationError) as raised:
        validate_first_day_of_month(date(2026, 10, day))

    assert [error.code for error in raised.value.error_list] == ["month.not_first_day"]
