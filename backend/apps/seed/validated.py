"""Create and save demo records only after the model's own rules accept them."""

from typing import Any, TypeVar

from django.db import models

ModelT = TypeVar("ModelT", bound=models.Model)


def create_validated(model_class: type[ModelT], **fields: Any) -> ModelT:
    """Create a record only after the model's own rules (`full_clean()`) accept it."""
    record = model_class(**fields)
    record.full_clean()
    record.save()
    return record


def save_validated(record: models.Model) -> None:
    """Save a changed record only after the model's own rules accept it."""
    record.full_clean()
    record.save()
