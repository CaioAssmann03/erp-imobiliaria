from django.test import TestCase
from typing_extensions import final

from apps.persons.models import PeopleIndividual

from .base import make_individual


@final
class PersonModelTests(TestCase):
    def test_str_returns_name(self) -> None:
        self.assertEqual(str(make_individual(name="Maria")), "Maria")

    def test_delete_person_cascades(self) -> None:
        person = make_individual()
        _ = person.delete()
        self.assertFalse(PeopleIndividual.objects.exists())
