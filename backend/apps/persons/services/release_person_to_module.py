from apps.persons.models import Person, PersonModuleMembership


def release_person_to_module(person: Person, module: str) -> None:
    """Let `person` be used in `module`; releasing twice changes nothing. An unregistered module is refused by the model."""
    if person.module_memberships.filter(module=module).exists():
        return
    membership = PersonModuleMembership(person=person, module=module)
    membership.full_clean()
    membership.save()
