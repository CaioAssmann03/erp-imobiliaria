import uuid
from decimal import Decimal

import pytest
from django.db import IntegrityError, connection, transaction

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

    def test_database_rejects_late_fee_above_2(self, condominium: Condominium) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = BillingRules.objects.create(
                condominium=condominium, late_fee_percentage=Decimal("2.01")
            )

    def test_database_rejects_initial_late_fee_above_2(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = BillingRules.objects.create(
                condominium=condominium,
                initial_late_fee_percentage=Decimal("2.5"),
                initial_late_fee_days=5,
            )

    @pytest.mark.parametrize(
        "half_filled",
        [
            {"initial_late_fee_percentage": Decimal("1")},
            {"initial_late_fee_days": 5},
        ],
    )
    def test_database_rejects_a_half_filled_first_days_tier(
        self, condominium: Condominium, half_filled: dict[str, object]
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = BillingRules.objects.create(condominium=condominium, **half_filled)

    def test_database_rejects_zero_first_days(self, condominium: Condominium) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = BillingRules.objects.create(
                condominium=condominium,
                initial_late_fee_percentage=Decimal("1"),
                initial_late_fee_days=0,
            )


@pytest.mark.parametrize("late_fee", ["-0.01", "2.01", "100"])
def test_late_fee_out_of_range_is_invalid(late_fee: str) -> None:
    serializer = BillingRulesSerializer(data={"late_fee_percentage": late_fee})

    assert not serializer.is_valid()
    assert serializer.errors["late_fee_percentage"][0].code == "billing_rules.late_fee_percentage.out_of_range"


@pytest.mark.parametrize("late_fee", ["0", "1", "2", "2.00"])
def test_late_fee_in_range_is_valid(late_fee: str) -> None:
    assert BillingRulesSerializer(data={"late_fee_percentage": late_fee}).is_valid()


def test_first_days_tier_above_the_late_fee_limit_is_invalid() -> None:
    serializer = BillingRulesSerializer(
        data={"initial_late_fee_percentage": "2.50", "initial_late_fee_days": 5}
    )

    assert not serializer.is_valid()
    assert (
        serializer.errors["initial_late_fee_percentage"][0].code
        == "billing_rules.late_fee_percentage.out_of_range"
    )


@pytest.mark.parametrize(
    ("data", "missing_field"),
    [
        ({"initial_late_fee_percentage": "1.00"}, "initial_late_fee_days"),
        ({"initial_late_fee_days": 5}, "initial_late_fee_percentage"),
    ],
)
def test_first_days_tier_needs_percentage_and_days(data: dict[str, object], missing_field: str) -> None:
    serializer = BillingRulesSerializer(data=data)

    assert not serializer.is_valid()
    assert serializer.errors[missing_field][0].code == "billing_rules.initial_late_fee.incomplete"


def test_first_days_tier_with_percentage_and_days_is_valid() -> None:
    assert BillingRulesSerializer(
        data={"initial_late_fee_percentage": "1.00", "initial_late_fee_days": 5}
    ).is_valid()


def test_first_days_must_be_at_least_one() -> None:
    serializer = BillingRulesSerializer(
        data={"initial_late_fee_percentage": "1.00", "initial_late_fee_days": 0}
    )

    assert not serializer.is_valid()
    assert (
        serializer.errors["initial_late_fee_days"][0].code
        == "billing_rules.initial_late_fee_days.out_of_range"
    )


@pytest.mark.parametrize("field", ["due_month", "competence_month", "interest_calculation"])
def test_unknown_choices_are_invalid(field: str) -> None:
    serializer = BillingRulesSerializer(data={field: "nonsense"})

    assert not serializer.is_valid()
    assert field in serializer.errors


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("due_month", "reference"),
        ("due_month", "following"),
        ("competence_month", "same_as_due"),
        ("competence_month", "before_due"),
        ("interest_calculation", "full_month"),
        ("interest_calculation", "per_day"),
    ],
)
def test_each_choice_is_valid(field: str, value: str) -> None:
    assert BillingRulesSerializer(data={field: value}).is_valid()


class TestBillingRulesDefaults:
    def test_a_new_rule_set_charges_nothing_for_lateness(self, condominium: Condominium) -> None:
        billing_rules = BillingRules.objects.create(condominium=condominium)
        billing_rules.refresh_from_db()

        assert billing_rules.due_month == BillingRules.DueMonth.REFERENCE
        assert billing_rules.competence_month == BillingRules.CompetenceMonth.SAME_AS_DUE
        assert billing_rules.late_fee_percentage == Decimal("0")
        assert billing_rules.initial_late_fee_percentage is None
        assert billing_rules.initial_late_fee_days is None
        assert billing_rules.interest_calculation == BillingRules.InterestCalculation.FULL_MONTH
        assert billing_rules.interest_grace_days == 0
        assert not billing_rules.should_show_qr_code
        assert not billing_rules.should_show_fee_statement

    def test_a_row_written_without_the_new_columns_gets_the_defaults(
        self, condominium: Condominium
    ) -> None:
        """An old container inserts the columns it knows; the database fills in the others."""
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO condominiums_billingrules"
                " (id, condominium_id, due_day, due_on_business_day, calculation_period,"
                " early_payment_discount_percentage, early_payment_discount_days, credit_limit)"
                " VALUES (%s, %s, 10, false, 'following', 0, 0, 0)",
                [uuid.uuid4(), condominium.pk],
            )

        billing_rules = BillingRules.objects.get(condominium=condominium)

        assert billing_rules.due_month == "following"
        assert billing_rules.competence_month == "same_as_due"
        assert billing_rules.late_fee_percentage == Decimal("0")
        assert billing_rules.interest_calculation == "full_month"
        assert billing_rules.interest_grace_days == 0
        assert not billing_rules.should_show_qr_code


@pytest.mark.parametrize("due_day", [0, 29])
def test_model_validator_rejects_due_day_out_of_range(due_day: int) -> None:
    with pytest.raises(Exception):
        validate_due_day(due_day)
