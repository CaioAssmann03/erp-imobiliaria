"""Error codes are stable and complete (spec 006, R1, R9)."""

import ast
import re
from pathlib import Path

from django.apps import apps as django_apps

from apps.core.infrastructure.errors.registry import (
    GENERIC_ERROR_CODES,
    all_error_codes,
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


# ----- R9: unique, registered -----


def test_codes_are_unique_across_apps() -> None:
    codes = domain_error_codes()

    assert len(codes) == len(set(codes))
    assert not set(codes) & set(GENERIC_ERROR_CODES)
