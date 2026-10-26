from apps.persons.models import Person
from apps.persons.modules import membership_model


def remove_person_from_module(person: Person, module: str) -> None:
    """Stop offering `person` in `module`; the links they already have there stay."""
    _ = membership_model(module).objects.filter(person=person).delete()  # type: ignore[attr-defined]
