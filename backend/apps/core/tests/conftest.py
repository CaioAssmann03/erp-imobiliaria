import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.fixture
def api_client(db: None) -> APIClient:
    client = APIClient()
    user = get_user_model().objects.create_user(username="tester", password="x")
    client.force_authenticate(user=user)
    return client
