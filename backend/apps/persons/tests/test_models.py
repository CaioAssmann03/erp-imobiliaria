import pytest

from apps.persons.models import people_individual

from .base import make_individual

pytestmark = pytest.mark.django_db


def test_str_returns_name() -> None:
    assert str(make_individual(name="Maria")) == "Maria"


def test_delete_person_cascades() -> None:
    person = make_individual()
    _ = person.delete()
    assert not people_individual.objects.exists()
