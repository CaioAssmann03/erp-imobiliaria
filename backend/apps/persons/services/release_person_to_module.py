from apps.persons.models import Person
from apps.persons.modules import membership_model


def release_person_to_module(person: Person, module: str) -> None:
    """Let `person` be used in `module`; releasing twice changes nothing."""
    _ = membership_model(module).objects.get_or_create(person=person)  # type: ignore[attr-defined]
