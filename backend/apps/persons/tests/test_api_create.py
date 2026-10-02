from rest_framework import status
from typing_extensions import final

from apps.persons.models import Person

from .base import PersonAPITestCase, body, make_individual


@final
class PersonCreateTests(PersonAPITestCase):
    def test_create_individual(self) -> None:
        payload = {
            "name": "Maria Silva",
            "people_individual": {"cpf": "12345678901", "job": "Engenheira"},
        }

        response = self.client.post(self.list_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        person = Person.objects.get(name="Maria Silva")
        self.assertEqual(person.people_individual.cpf, "12345678901")

    def test_create_requires_name(self) -> None:
        response = self.client.post(self.list_url, {"email": "a@b.com"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", body(response))

    def test_create_duplicate_cpf_is_rejected(self) -> None:
        _ = make_individual(cpf="12345678901")

        response = self.client.post(
            self.list_url,
            {"name": "Outra", "people_individual": {"cpf": "12345678901"}},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Person.objects.count(), 1)
