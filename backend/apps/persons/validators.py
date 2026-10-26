from apps.persons.errors import PersonModuleMembershipError
from apps.persons.modules import is_registered_module


def validate_registered_module(module: str) -> None:
    if not is_registered_module(module):
        raise PersonModuleMembershipError.MODULE_UNKNOWN.to_validation_error()
