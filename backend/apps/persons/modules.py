"""The modules a person can be released to (spec 038).

`persons` knows a module only by its key and the name of the reverse relation of its membership
model (`Person.<relation_name>`); each module's app registers itself in `AppConfig.ready()`, so
adding a module never touches this app.
"""

from django.db import models
from rest_framework import serializers

_relation_name_by_module: dict[str, str] = {}


def register_person_module(module: str, relation_name: str) -> None:
    """`relation_name` is the `related_name` of the module's one-to-one membership to `Person`."""
    _relation_name_by_module[module] = relation_name


def registered_modules() -> list[str]:
    return sorted(_relation_name_by_module)


def module_choices() -> list[tuple[str, str]]:
    return [(module, module.title()) for module in registered_modules()]


def membership_relation_name(module: str) -> str:
    return _relation_name_by_module[module]


def membership_model(module: str) -> type[models.Model]:
    """The model whose rows say which people belong to `module`."""
    from apps.persons.models import Person

    return Person._meta.get_field(membership_relation_name(module)).related_model  # type: ignore[return-value]


def validate_module(raw_module: str, field_name: str = "module") -> str:
    """`raw_module` as a registered module, or a 400 `invalid_choice` on the `field_name` field."""
    try:
        return str(
            serializers.ChoiceField(choices=module_choices()).run_validation(raw_module)
        )
    except serializers.ValidationError as error:
        raise serializers.ValidationError({field_name: error.detail}) from error
