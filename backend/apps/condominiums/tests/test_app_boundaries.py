"""`billing` depends on `condominiums`, never the other way around (spec 041, R3)."""

import ast
from pathlib import Path

CONDOMINIUMS = Path(__file__).resolve().parents[1]


def imported_modules(path: Path) -> list[str]:
    modules: list[str] = []
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.Import):
            modules += [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.append(node.module)
    return modules


def test_condominiums_does_not_import_billing() -> None:
    offenders = [
        str(path.relative_to(CONDOMINIUMS))
        for path in CONDOMINIUMS.rglob("*.py")
        if "migrations" not in path.parts
        and "tests" not in path.parts
        and any(module == "apps.billing" or module.startswith("apps.billing.") for module in imported_modules(path))
    ]

    assert offenders == []
