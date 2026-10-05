from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction

from ..models import BillingRules, Condominium
from ..serializers import BillingRulesSerializer
from ..validators import validate_due_day


pytestmark = pytest.mark.django_db  # the serializer runs the model rules (uniqueness, relations)


@pytest.mark.parametrize("due_day", [0, 29, 31])
def test_due_day_out_of_range_is_invalid(due_day: int) -> None:
    serializer = BillingRulesSerializer(data={"due_day": due_day})

    assert not serializer.is_valid()
    assert "due_day" in serializer.errors


@pytest.mark.parametrize("due_day", [1, 10, 28])
def test_due_day_in_range_is_valid(due_day: int) -> None:
    assert BillingRulesSerializer(data={"due_day": due_day}).is_valid()


@pytest.mark.parametrize("discount", ["-1", "100.01"])
def test_discount_out_of_range_is_invalid(discount: str) -> None:
    serializer = BillingRulesSerializer(
        data={"early_payment_discount_percentage": discount}
    )

    assert not serializer.is_valid()
    assert "early_payment_discount_percentage" in serializer.errors


@pytest.mark.parametrize("discount", ["0", "5.5", "100"])
def test_discount_in_range_is_valid(discount: str) -> None:
    assert BillingRulesSerializer(
        data={"early_payment_discount_percentage": discount}
    ).is_valid()


class TestBillingRulesConstraints:
    def test_database_rejects_invalid_due_day(self, condominium: Condominium) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = BillingRules.objects.create(condominium=condominium, due_day=30)

    def test_database_rejects_discount_above_100(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = BillingRules.objects.create(
                condominium=condominium,
                early_payment_discount_percentage=Decimal("101"),
            )


@pytest.mark.parametrize("due_day", [0, 29])
def test_model_validator_rejects_due_day_out_of_range(due_day: int) -> None:
    with pytest.raises(Exception):
        validate_due_day(due_day)
