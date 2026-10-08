"""Services are one file per use case and hold no business rule (the rules are the models')."""

import ast
from pathlib import Path

APPS_DIR = Path(__file__).resolve().parents[3]


def service_files() -> list[Path]:
    return sorted(
        path for path in APPS_DIR.glob("*/services/*.py") if path.name != "__init__.py"
    )


def test_services_exist() -> None:
    assert service_files()


def test_every_service_file_defines_the_use_case_it_is_named_after() -> None:
    misnamed = [
        str(path.relative_to(APPS_DIR))
        for path in service_files()
        if path.stem
        not in {
            node.name
            for node in ast.parse(path.read_text()).body
            if isinstance(node, ast.FunctionDef)
        }
    ]

    assert misnamed == []


def test_services_do_not_raise_business_rules() -> None:
    """A rule is a model's (`clean()`, validators, constraints): a service never builds a `ValidationError`."""
    offenders = [
        str(path.relative_to(APPS_DIR))
        for path in service_files()
        if any(
            isinstance(node, ast.Name) and node.id == "ValidationError"
            for node in ast.walk(ast.parse(path.read_text()))
        )
    ]

    assert offenders == []
