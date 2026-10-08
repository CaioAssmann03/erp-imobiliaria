"""`ModelRules`: one method per rule, the first violated rule of a field wins (no database needed)."""

from types import SimpleNamespace
from typing import Any

import pytest
from django.core.exceptions import ValidationError

from apps.condominiums.errors import UnitPersonError
from apps.core.models.rules import ModelRules, rule


class SampleRules(ModelRules[Any]):
    def __init__(self, instance: Any) -> None:
        super().__init__(instance)
        self.evaluated: list[str] = []

    @rule("ownership_percentage", UnitPersonError.PERCENTAGE_REQUIRED_FOR_OWNER)
    def first_rule(self) -> bool:
        self.evaluated.append("first_rule")
        return self.instance.first_violated

    @rule("ownership_percentage", UnitPersonError.PERCENTAGE_SUM_EXCEEDS_100)
    def second_rule_of_the_same_field(self) -> bool:
        self.evaluated.append("second_rule_of_the_same_field")
        return self.instance.second_violated

    @rule("end_date", UnitPersonError.END_DATE_BEFORE_START_DATE)
    def rule_of_another_field(self) -> bool:
        self.evaluated.append("rule_of_another_field")
        return self.instance.other_violated

    def helper_that_is_not_a_rule(self) -> bool:  # an undecorated method is never run
        raise AssertionError("not a rule")


def instance(first: bool = False, second: bool = False, other: bool = False) -> SimpleNamespace:
    return SimpleNamespace(first_violated=first, second_violated=second, other_violated=other)


def test_a_violated_rule_reports_its_error_on_its_field() -> None:
    errors = SampleRules(instance(other=True)).errors()

    assert list(errors) == ["end_date"]
    assert errors["end_date"].code == UnitPersonError.END_DATE_BEFORE_START_DATE.value
    assert errors["end_date"].message == UnitPersonError.END_DATE_BEFORE_START_DATE.message


def test_no_violation_means_no_errors_and_validate_passes() -> None:
    rules = SampleRules(instance())

    assert rules.errors() == {}
    rules.validate()


def test_the_first_violated_rule_of_a_field_wins() -> None:
    errors = SampleRules(instance(first=True, second=True)).errors()

    assert errors["ownership_percentage"].code == UnitPersonError.PERCENTAGE_REQUIRED_FOR_OWNER.value


def test_a_rule_is_not_evaluated_when_its_field_already_has_an_error() -> None:
    rules = SampleRules(instance(first=True, second=True, other=True))

    _ = rules.errors()

    assert rules.evaluated == ["first_rule", "rule_of_another_field"]  # the second rule never ran


def test_rules_run_in_the_order_they_are_written() -> None:
    rules = SampleRules(instance())

    _ = rules.errors()

    assert rules.evaluated == ["first_rule", "second_rule_of_the_same_field", "rule_of_another_field"]


def test_validate_raises_one_error_per_field() -> None:
    with pytest.raises(ValidationError) as raised:
        SampleRules(instance(second=True, other=True)).validate()

    assert set(raised.value.error_dict) == {"ownership_percentage", "end_date"}
    assert raised.value.error_dict["ownership_percentage"][0].code == UnitPersonError.PERCENTAGE_SUM_EXCEEDS_100.value
