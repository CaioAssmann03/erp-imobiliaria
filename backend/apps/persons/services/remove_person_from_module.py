from apps.persons.models import Person


def remove_person_from_module(person: Person, module: str) -> None:
    """Stop offering `person` in `module`; the links they already have there stay."""
    _ = person.module_memberships.filter(module=module).delete()
