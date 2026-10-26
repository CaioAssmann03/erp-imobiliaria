"""The modules a person can be released to (specs 038 and 040).

`persons` knows a module only by its key, which is data in `PersonModuleMembership`; each module's app
registers its key in `AppConfig.ready()`, so adding a module never touches this app and needs no model.
"""

from rest_framework import serializers

_registered_modules: set[str] = set()


def register_person_module(module: str) -> None:
    _registered_modules.add(module)


def unregister_person_module(module: str) -> None:
    """Only the tests undo a registration (a module is never removed while the server runs)."""
    _registered_modules.discard(module)


def registered_modules() -> list[str]:
    return sorted(_registered_modules)


def is_registered_module(module: str) -> bool:
    return module in _registered_modules


def module_choices() -> list[tuple[str, str]]:
    return [(module, module.title()) for module in registered_modules()]


def validate_module(raw_module: str, field_name: str = "module") -> str:
    """`raw_module` as a registered module, or a 400 `invalid_choice` on the `field_name` field."""
    try:
        return str(
            serializers.ChoiceField(choices=module_choices()).run_validation(raw_module)
        )
    except serializers.ValidationError as error:
        raise serializers.ValidationError({field_name: error.detail}) from error
