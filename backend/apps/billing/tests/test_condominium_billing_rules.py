import uuid
from datetime import date
from decimal import Decimal

import pytest
from django.db import IntegrityError, connection, transaction

from apps.condominiums.models import Condominium

from ..models import CondominiumBillingRules
from ..serializers import CondominiumBillingRulesSerializer
from ..validators import validate_due_day


pytestmark = pytest.mark.django_db  # the serializer runs the model rules (uniqueness, relations)


def rules_serializer(condominium: Condominium, data: dict[str, object]) -> CondominiumBillingRulesSerializer:
    return CondominiumBillingRulesSerializer(data={"condominium": str(condominium.pk), **data})


@pytest.mark.parametrize("due_day", [0, 29, 31])
def test_due_day_out_of_range_is_invalid(due_day: int, condominium: Condominium) -> None:
    serializer = rules_serializer(condominium, {"due_day": due_day})

    assert not serializer.is_valid()
    assert "due_day" in serializer.errors


@pytest.mark.parametrize("due_day", [1, 10, 28])
def test_due_day_in_range_is_valid(due_day: int, condominium: Condominium) -> None:
    assert rules_serializer(condominium, {"due_day": due_day}).is_valid()


@pytest.mark.parametrize("discount", ["-1", "100.01"])
def test_discount_out_of_range_is_invalid(discount: str, condominium: Condominium) -> None:
    serializer = rules_serializer(
        condominium, {"early_payment_discount_percentage": discount}
    )

    assert not serializer.is_valid()
    assert "early_payment_discount_percentage" in serializer.errors


@pytest.mark.parametrize("discount", ["0", "5.5", "100"])
def test_discount_in_range_is_valid(discount: str, condominium: Condominium) -> None:
    assert rules_serializer(
        condominium, {"early_payment_discount_percentage": discount}
    ).is_valid()


class TestBillingRulesConstraints:
    def test_database_rejects_invalid_due_day(self, condominium: Condominium) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = CondominiumBillingRules.objects.create(condominium=condominium, due_day=30)

    def test_database_rejects_discount_above_100(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = CondominiumBillingRules.objects.create(
                condominium=condominium,
                early_payment_discount_percentage=Decimal("101"),
            )

    def test_database_rejects_late_fee_above_2(self, condominium: Condominium) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = CondominiumBillingRules.objects.create(
                condominium=condominium, late_fee_percentage=Decimal("2.01")
            )

    def test_database_rejects_initial_late_fee_above_2(
        self, condominium: Condominium
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = CondominiumBillingRules.objects.create(
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
            _ = CondominiumBillingRules.objects.create(condominium=condominium, **half_filled)

    def test_database_rejects_zero_first_days(self, condominium: Condominium) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = CondominiumBillingRules.objects.create(
                condominium=condominium,
                initial_late_fee_percentage=Decimal("1"),
                initial_late_fee_days=0,
            )


@pytest.mark.parametrize("late_fee", ["-0.01", "2.01", "100"])
def test_late_fee_out_of_range_is_invalid(late_fee: str, condominium: Condominium) -> None:
    serializer = rules_serializer(condominium, {"late_fee_percentage": late_fee})

    assert not serializer.is_valid()
    assert serializer.errors["late_fee_percentage"][0].code == "condominium_billing_rules.late_fee_percentage.out_of_range"


@pytest.mark.parametrize("late_fee", ["0", "1", "2", "2.00"])
def test_late_fee_in_range_is_valid(late_fee: str, condominium: Condominium) -> None:
    assert rules_serializer(condominium, {"late_fee_percentage": late_fee}).is_valid()


def test_first_days_tier_above_the_late_fee_limit_is_invalid(condominium: Condominium) -> None:
    serializer = rules_serializer(
        condominium, {"initial_late_fee_percentage": "2.50", "initial_late_fee_days": 5}
    )

    assert not serializer.is_valid()
    assert (
        serializer.errors["initial_late_fee_percentage"][0].code
        == "condominium_billing_rules.late_fee_percentage.out_of_range"
    )


@pytest.mark.parametrize(
    ("data", "missing_field"),
    [
        ({"initial_late_fee_percentage": "1.00"}, "initial_late_fee_days"),
        ({"initial_late_fee_days": 5}, "initial_late_fee_percentage"),
    ],
)
def test_first_days_tier_needs_percentage_and_days(data: dict[str, object], missing_field: str, condominium: Condominium) -> None:
    serializer = rules_serializer(condominium, data)

    assert not serializer.is_valid()
    assert serializer.errors[missing_field][0].code == "condominium_billing_rules.initial_late_fee.incomplete"


def test_first_days_tier_with_percentage_and_days_is_valid(condominium: Condominium) -> None:
    assert rules_serializer(
        condominium, {"initial_late_fee_percentage": "1.00", "initial_late_fee_days": 5}
    ).is_valid()


def test_first_days_must_be_at_least_one(condominium: Condominium) -> None:
    serializer = rules_serializer(
        condominium, {"initial_late_fee_percentage": "1.00", "initial_late_fee_days": 0}
    )

    assert not serializer.is_valid()
    assert (
        serializer.errors["initial_late_fee_days"][0].code
        == "condominium_billing_rules.initial_late_fee_days.out_of_range"
    )


@pytest.mark.parametrize("field", ["due_month", "competence_month", "interest_calculation"])
def test_unknown_choices_are_invalid(field: str, condominium: Condominium) -> None:
    serializer = rules_serializer(condominium, {field: "nonsense"})

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
def test_each_choice_is_valid(field: str, value: str, condominium: Condominium) -> None:
    assert rules_serializer(condominium, {field: value}).is_valid()


class TestBillingRulesDefaults:
    def test_a_new_rule_set_charges_nothing_for_lateness(self, condominium: Condominium) -> None:
        billing_rules = CondominiumBillingRules.objects.create(condominium=condominium)
        billing_rules.refresh_from_db()

        assert billing_rules.due_month == CondominiumBillingRules.DueMonth.REFERENCE
        assert billing_rules.competence_month == CondominiumBillingRules.CompetenceMonth.SAME_AS_DUE
        assert billing_rules.late_fee_percentage == Decimal("0")
        assert billing_rules.initial_late_fee_percentage is None
        assert billing_rules.initial_late_fee_days is None
        assert billing_rules.interest_calculation == CondominiumBillingRules.InterestCalculation.FULL_MONTH
        assert billing_rules.interest_grace_days == 0
        assert not billing_rules.should_show_qr_code
        assert not billing_rules.should_show_fee_statement

    def test_a_row_written_without_the_new_columns_gets_the_defaults(
        self, condominium: Condominium
    ) -> None:
        """The columns with a database default are filled in by the database."""
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO billing_condominiumbillingrules"
                " (id, condominium_id, due_day, due_on_business_day, due_month,"
                " early_payment_discount_percentage, early_payment_discount_days, credit_limit)"
                " VALUES (%s, %s, 10, false, 'following', 0, 0, 0)",
                [uuid.uuid4(), condominium.pk],
            )

        billing_rules = CondominiumBillingRules.objects.get(condominium=condominium)

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


# ----- spec 026: issuance day, manager unit exemption and the due date -----


@pytest.mark.parametrize("issuance_day", [0, 29])
def test_issuance_day_out_of_range_is_invalid(issuance_day: int, condominium: Condominium) -> None:
    serializer = rules_serializer(condominium, {"issuance_day": issuance_day})

    assert not serializer.is_valid()
    assert [error.code for error in serializer.errors["issuance_day"]] == ["condominium_billing_rules.issuance_day.out_of_range"]


def test_issuance_day_defaults_to_the_first_and_nothing_is_exempt(condominium: Condominium) -> None:
    rules = CondominiumBillingRules.objects.create(condominium=condominium)

    assert (rules.issuance_day, rules.exempts_manager_unit) == (1, False)


def test_issuance_day_is_refused_by_the_database(condominium: Condominium) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = CondominiumBillingRules.objects.create(condominium=condominium, issuance_day=29)


@pytest.mark.parametrize(
    ("due_on_business_day", "expected"),
    [
        (False, date(2026, 10, 10)),  # a Saturday stays
        (True, date(2026, 10, 12)),  # moves to Monday
    ],
)
def test_due_date_moves_off_the_weekend_only_when_asked(condominium: Condominium, due_on_business_day: bool, expected: date) -> None:
    rules = CondominiumBillingRules(condominium=condominium, due_day=10, due_on_business_day=due_on_business_day)

    assert rules.due_date_of(date(2026, 10, 1)) == expected


def test_due_date_follows_the_due_month_and_keeps_weekdays(condominium: Condominium) -> None:
    rules = CondominiumBillingRules(condominium=condominium, due_day=14, due_month=CondominiumBillingRules.DueMonth.FOLLOWING, due_on_business_day=True)

    assert rules.due_date_of(date(2026, 10, 1)) == date(2026, 11, 16)  # 14 Nov 2026 is a Saturday
    assert CondominiumBillingRules(condominium=condominium, due_day=15, due_on_business_day=True).due_date_of(date(2026, 10, 1)) == date(2026, 10, 15)


class TestBillingMonths:
    """The reference month is the month the issuance refers to (the Sami's "referência")."""

    @pytest.mark.parametrize(
        ("due_month", "competence_month", "due", "competence"),
        [
            ("following", "same_as_due", date(2026, 11, 1), date(2026, 11, 1)),
            ("following", "before_due", date(2026, 11, 1), date(2026, 10, 1)),
            ("reference", "same_as_due", date(2026, 10, 1), date(2026, 10, 1)),
            ("reference", "before_due", date(2026, 10, 1), date(2026, 9, 1)),
        ],
    )
    def test_due_month_and_competence_month_of_a_reference_month(
        self, due_month: str, competence_month: str, due: date, competence: date
    ) -> None:
        billing_rules = CondominiumBillingRules(due_month=due_month, competence_month=competence_month)
        reference_month = date(2026, 10, 17)  # any day of the month

        assert billing_rules.due_month_of(reference_month) == due
        assert billing_rules.competence_month_of(reference_month) == competence

    def test_the_months_cross_the_year_boundary(self) -> None:
        following = CondominiumBillingRules(due_month="following", competence_month="same_as_due")
        before_due = CondominiumBillingRules(due_month="reference", competence_month="before_due")

        assert following.due_month_of(date(2026, 12, 31)) == date(2027, 1, 1)
        assert before_due.competence_month_of(date(2027, 1, 5)) == date(2026, 12, 1)
