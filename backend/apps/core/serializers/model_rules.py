import copy
from collections.abc import Collection, Mapping
from typing import Any

from django.core.exceptions import NON_FIELD_ERRORS, ValidationError as DjangoValidationError
from django.db import models
from rest_framework import serializers
from rest_framework.settings import api_settings


def _model_field_values(
    model: type[models.Model], input_values: Mapping[str, Any]
) -> dict[str, Any]:
    """Attributes that are real model values.

    Nested serializer data (a dict for a relation such as `address`) is not a model value:
    the nested serializer validates it with its own model.
    """
    field_values: dict[str, Any] = {}
    for field in model._meta.concrete_fields:
        if field.name not in input_values:
            continue
        field_value = input_values[field.name]
        is_nested_data = (
            field.is_relation
            and field_value is not None
            and not isinstance(field_value, models.Model)
        )
        if is_nested_data:
            continue
        field_values[field.name] = field_value
    return field_values


def build_candidate(
    model: type[models.Model],
    input_values: Mapping[str, Any],
    existing_record: models.Model | None = None,
) -> models.Model:
    """Unsaved copy of the record as it would be after applying `input_values` (create or update)."""
    field_values = _model_field_values(model, input_values)
    if existing_record is None:
        return model(**field_values)
    candidate = copy.copy(existing_record)
    for field_name, field_value in field_values.items():
        setattr(candidate, field_name, field_value)
    return candidate


def _to_drf_errors(error: DjangoValidationError) -> dict[str, Any]:
    if hasattr(error, "error_dict"):
        details = error.message_dict
    else:
        details = {NON_FIELD_ERRORS: error.messages}
    return {
        (api_settings.NON_FIELD_ERRORS_KEY if field == NON_FIELD_ERRORS else field): messages
        for field, messages in details.items()
    }


def run_model_rules(candidate: models.Model, excluded_fields: Collection[str] = ()) -> None:
    """Run the model's own rules (field validators, `clean()`, constraints, uniqueness).

    Business rules live in the models; this turns a Django `ValidationError` into a DRF 400.
    """
    try:
        candidate.full_clean(exclude=list(excluded_fields))
    except DjangoValidationError as error:
        raise serializers.ValidationError(_to_drf_errors(error)) from error


class ModelRulesMixin:
    """Serializer mixin: input is validated by the model's rules, never by rules written here.

    Put it **before** `ModelSerializer` in the bases. Relations that are absent from the input
    (for example the parent FK of a nested serializer) are excluded from validation.
    """

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)  # type: ignore[misc]
        model: type[models.Model] = self.Meta.model  # type: ignore[attr-defined]
        existing_record = self.instance if isinstance(self.instance, models.Model) else None  # type: ignore[attr-defined]
        candidate = build_candidate(model, attrs, existing_record)
        provided_values = _model_field_values(model, attrs)
        # Relations without a model value (absent, or nested data) are not validated here.
        excluded_fields = {
            field.name
            for field in model._meta.concrete_fields
            if field.is_relation
            and field.name not in provided_values
            and (existing_record is None or field.name in attrs)
        }
        run_model_rules(candidate, excluded_fields)
        return attrs
