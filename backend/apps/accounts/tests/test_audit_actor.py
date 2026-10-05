"""The actor of the audit entries (spec 005, R3, R7)."""

import pytest
from auditlog.models import LogEntry
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.models import Company
from apps.persons.models import Person

pytestmark = pytest.mark.django_db


def token_client(user: User, password: str = "segredo123") -> APIClient:
    """A client that really authenticates with a JWT (`force_authenticate` skips the auth class)."""
    user.set_password(password)
    user.save()
    anonymous = APIClient()
    tokens = anonymous.post(
        reverse("token_obtain_pair"), {"username": user.username, "password": password}, format="json"
    ).json()
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


def test_api_write_logs_the_jwt_user(company: Company) -> None:
    user = User.objects.create_user("maria", password="x", company=company)
    client = token_client(user)

    response = client.post("/api/persons/", {"name": "Nova pessoa"}, format="json")

    assert response.status_code == 201
    person = Person.objects.get(name="Nova pessoa")
    entry = LogEntry.objects.get_for_object(person).get()
    assert entry.actor == user


def test_admin_edit_logs_the_session_user(company: Company) -> None:
    superuser = User.objects.create_superuser("root", password="x", company=company)
    client = Client()
    client.force_login(superuser)

    response = client.post(
        reverse("admin:core_company_change", args=[company.pk]),
        {
            "legal_name": company.legal_name,
            "trade_name": "Via admin",
            "cnpj": company.cnpj,
            "logo_url": "",
            "zip_code": "",
            "street": "",
            "district": "",
            "city": "",
            "state": "",
            "active": "on",
        },
    )

    assert response.status_code == 302, response.content[:300]
    entry = LogEntry.objects.get_for_object(company).latest("timestamp")
    assert entry.actor == superuser
    assert entry.changes["trade_name"][1] == "Via admin"


def test_user_entries_exclude_password_and_last_login(company: Company) -> None:
    user = User.objects.create_user("maria", password="x", company=company)
    user.set_password("outra-senha")
    user.save()
    _ = token_client(user, "terceira-senha")  # logs in: updates last_login

    changed_fields = {
        field for entry in LogEntry.objects.get_for_object(user) for field in entry.changes
    }

    assert "password" not in changed_fields
    assert "last_login" not in changed_fields
    assert "username" in changed_fields


def test_the_openapi_schema_keeps_the_jwt_security_scheme() -> None:
    from drf_spectacular.generators import SchemaGenerator

    schema = SchemaGenerator().get_schema(request=None, public=True)  # type: ignore[no-untyped-call]

    assert "jwtAuth" in schema["components"]["securitySchemes"]
    assert {"jwtAuth": []} in schema["paths"]["/api/persons/"]["get"]["security"]
