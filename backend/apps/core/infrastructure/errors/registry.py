"""Every error code of the API, collected from the apps (spec 006).

Each app declares its domain errors (code and English message) in `apps/<app>/errors/<entity>.py`
as `RuleError` classes; this module finds them through the installed apps, so `core` imports no
domain app by name.
"""

from enum import StrEnum
from importlib import import_module
from importlib.util import find_spec
from pkgutil import iter_modules

from django.apps import apps as django_apps

GENERIC_ERROR_CODES: tuple[str, ...] = (
    "authentication_failed",
    "bad_authorization_header",
    "bad_gateway",
    "blank",
    "does_not_exist",
    "empty",
    "incorrect_type",
    "invalid",
    "invalid_choice",
    "max_decimal_places",
    "max_digits",
    "max_length",
    "max_value",
    "max_whole_digits",
    "method_not_allowed",
    "min_length",
    "min_value",
    "no_active_account",
    "not_a_list",
    "not_acceptable",
    "not_authenticated",
    "not_found",
    "null",
    "parse_error",
    "permission_denied",
    "required",
    "throttled",
    "token_not_valid",
    "unique",
    "unique_together",
    "unsupported_media_type",
    "user_inactive",
    "user_not_found",
)


def _errors_package_names() -> list[str]:
    """`<app>.errors` of each installed app; `core`'s own live in `core.infrastructure.errors`."""
    return [
        "apps.core.infrastructure.errors" if config.name == "apps.core" else f"{config.name}.errors"
        for config in django_apps.get_app_configs()
    ]


def domain_error_code_enums() -> list[type[StrEnum]]:
    """The `RuleError` enums defined in the modules of the installed apps' `errors` packages."""
    enums: list[type[StrEnum]] = []
    for package_name in _errors_package_names():
        if find_spec(package_name) is None:
            continue
        package = import_module(package_name)
        for module_info in iter_modules(package.__path__):
            module_name = f"{package_name}.{module_info.name}"
            module = import_module(module_name)
            enums.extend(
                member
                for member in vars(module).values()
                if isinstance(member, type)
               and issubclass(member, StrEnum)
                and len(member) > 0  # the abstract base `RuleError` has no codes
                and member.__module__ == module_name
            )
    return enums


def domain_error_codes() -> list[str]:
    return [str(code) for enum in domain_error_code_enums() for code in enum]


def all_error_codes() -> list[str]:
    """Every code the API can answer, sorted: the contract the frontend translates."""
    return sorted({*GENERIC_ERROR_CODES, *domain_error_codes()})
