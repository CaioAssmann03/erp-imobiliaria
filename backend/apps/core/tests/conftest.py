import pytest
from apps.accounts.models import User
from rest_framework.test import APIClient


@pytest.fixture
def api_client(db: None) -> APIClient:
    client = APIClient()
    user = User.objects.create_user(username="tester", password="x")
    client.force_authenticate(user=user)
    return client
