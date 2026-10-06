from collections.abc import Callable
from typing import Generic, TypeVar

from django.core.exceptions import ValidationError
from django.db import models

from apps.core.errors.base import RuleError

ModelT = TypeVar("ModelT", bound=models.Model)
RuleMethod = Callable[..., bool]

_RULE_MARK = "_rule_field_and_error"


def rule(field: str, error: RuleError) -> Callable[[RuleMethod], RuleMethod]:
    """Mark a method of a `ModelRules` as one rule: it returns True when the rule is violated,
    and `error` is then reported on `field`."""

    def mark(method: RuleMethod) -> RuleMethod:
        setattr(method, _RULE_MARK, (field, error))
        return method

    return mark


class ModelRules(Generic[ModelT]):
    """Base of `models/rules/<entity>.py`: the cross-field and cross-record rules of one model.

    The model's `clean()` only calls `XxxRules(self).validate()`. Each rule is a method decorated
    with `@rule(field, error)` that answers "is this rule violated?" (named like a question:
    `ends_before_it_starts`). The rules run in the order they are written and **the first violated
    rule of a field wins**; a rule whose field already has an error is not even evaluated (so a
    rule that queries the database only runs when it can still matter).
    """

    def __init__(self, instance: ModelT) -> None:
        self.instance = instance

    def errors(self) -> dict[str, ValidationError]:
        errors: dict[str, ValidationError] = {}
        for method_name, field, error in self._rules():
            if field not in errors and getattr(self, method_name)():
                errors[field] = error.to_validation_error()
        return errors

    def validate(self) -> None:
        errors = self.errors()
        if errors:
            raise ValidationError(errors)

    @classmethod
    def _rules(cls) -> list[tuple[str, str, RuleError]]:
        """(method name, field, error) of every marked method, in definition order."""
        rules: list[tuple[str, str, RuleError]] = []
        for klass in reversed(cls.__mro__):
            for method_name, member in vars(klass).items():
                mark = getattr(member, _RULE_MARK, None)
                if mark is not None:
                    rules.append((method_name, *mark))
        return rules
