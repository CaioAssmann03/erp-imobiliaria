"""Error codes are stable and complete (spec 006, R1, R9)."""

import ast
import re
from pathlib import Path

import pytest
from django.apps import apps as django_apps
from django.core.exceptions import ValidationError

from apps.condominiums.models import AdministrationContract, Unit, UnitPerson
from apps.core.error_registry import (
    GENERIC_ERROR_CODES,
    all_error_codes,
    domain_error_code_enums,
    domain_error_codes,
)

APPS_DIR = Path(__file__).resolve().parents[3]
CODE_PATTERN = re.compile(r"^[a-z0-9_]+(\.[a-z0-9_]+)+$")


def app_models() -> list[type]:
    return [
        model
        for config in django_apps.get_app_configs()
        if config.name.startswith("apps.")
        for model in config.get_models()
    ]


def rule_source_files() -> list[Path]:
    """Models, rules classes and validators: where business rules are written."""
    files: list[Path] = []
    for pattern in ("*/models/*.py", "*/models/rules/*.py", "*/validators.py", "*/validators/*.py"):
        files.extend(APPS_DIR.glob(pattern))
    return sorted(files)


# ----- R1: every rule has a code -----


def test_every_constraint_has_a_violation_error_code() -> None:
    without_code = [
        f"{model.__name__}.{constraint.name}"
        for model in app_models()
        for constraint in model._meta.constraints  # type: ignore[attr-defined]
        if not constraint.violation_error_code
    ]

    assert without_code == []


def test_every_constraint_code_is_registered() -> None:
    registered = set(all_error_codes())
    unknown = [
        f"{model.__name__}.{constraint.name}: {constraint.violation_error_code}"
        for model in app_models()
        for constraint in model._meta.constraints  # type: ignore[attr-defined]
        if constraint.violation_error_code not in registered
    ]

    assert unknown == []


def test_every_validation_error_in_models_and_validators_has_a_code() -> None:
    """A `ValidationError(...)` carries `code=`, or only aggregates other errors (a name, a dict or a dict comprehension)."""
    missing: list[str] = []
    for source in rule_source_files():
        for node in ast.walk(ast.parse(source.read_text())):
            if not (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == "ValidationError"
            ):
                continue
            has_code = any(keyword.arg == "code" for keyword in node.keywords)
            is_aggregate = len(node.args) == 1 and isinstance(
                node.args[0], (ast.Name, ast.Dict, ast.DictComp)
            )
            if not has_code and not is_aggregate:
                missing.append(f"{source.relative_to(APPS_DIR)}:{node.lineno}")

    assert missing == []


def test_codes_have_the_dotted_lowercase_shape() -> None:
    malformed = [code for code in domain_error_codes() if not CODE_PATTERN.match(code)]

    assert malformed == []


# ----- R9: unique, registered -----


def test_codes_are_unique_across_apps() -> None:
    codes = domain_error_codes()

    assert len(codes) == len(set(codes))
    assert not set(codes) & set(GENERIC_ERROR_CODES)


def test_every_app_registry_is_found() -> None:
    apps_with_errors = {enum.__module__.split(".")[1] for enum in domain_error_code_enums()}

    assert {"core", "condominiums", "persons", "finance"} <= apps_with_errors


def test_every_error_has_an_english_message() -> None:
    without_message = [
        str(error)
        for enum in domain_error_code_enums()
        for error in enum
        if not error.message.endswith(".")  # type: ignore[attr-defined]
    ]

    assert without_message == []


@pytest.mark.parametrize(
    ("field", "build"),
    [
        ("fee_amount", lambda: AdministrationContract(fee_type="fixed")),
        ("fee_percentage", lambda: AdministrationContract(fee_type="variable", fee_basis="revenue")),
        ("fee_floor", lambda: AdministrationContract(fee_floor=10, fee_ceiling=5)),
    ],
)
def test_contract_clean_and_constraint_share_message_and_code(field: str, build) -> None:  # type: ignore[no-untyped-def]
    contract = build()
    with pytest.raises(ValidationError) as clean_error:
        contract.clean()
    clean_rule = clean_error.value.error_dict[field][0]

    matching = [
        constraint
        for constraint in AdministrationContract._meta.constraints
        if constraint.violation_error_code == clean_rule.code
    ]

    assert len(matching) == 1
    assert matching[0].get_violation_error_message() == clean_rule.message


@pytest.mark.parametrize(
    ("field", "build"),
    [
        ("end_date", lambda: UnitPerson(role="tenant", start_date="2025-02-01", end_date="2025-01-01")),
        ("ownership_percentage", lambda: UnitPerson(role="owner", start_date="2025-01-01")),
        (
            "ownership_percentage",
            lambda: UnitPerson(role="tenant", start_date="2025-01-01", ownership_percentage=10),
        ),
    ],
)
def test_unit_person_clean_and_constraint_share_message_and_code(field: str, build) -> None:  # type: ignore[no-untyped-def]
    link = build()
    from datetime import date

    for name in ("start_date", "end_date"):
        value = getattr(link, name)
        if isinstance(value, str):
            setattr(link, name, date.fromisoformat(value))
    with pytest.raises(ValidationError) as clean_error:
        link.clean()
    clean_rule = clean_error.value.error_dict[field][0]

    matching = [
        constraint
        for constraint in UnitPerson._meta.constraints
        if constraint.violation_error_code == clean_rule.code
    ]

    assert len(matching) == 1
    assert matching[0].get_violation_error_message() == clean_rule.message


def test_unit_ideal_fraction_validator_and_constraint_share_the_message() -> None:
    constraint = next(
        constraint
        for constraint in Unit._meta.constraints
        if constraint.name == "unit_ideal_fraction_0_1"
    )
    from apps.condominiums.validators import validate_ideal_fraction

    with pytest.raises(ValidationError) as validator_error:
        validate_ideal_fraction(2)  # type: ignore[arg-type]

    assert constraint.get_violation_error_message() == validator_error.value.message
