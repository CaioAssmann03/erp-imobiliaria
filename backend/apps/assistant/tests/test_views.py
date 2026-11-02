import importlib
import logging
from typing import Any

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from apps.assistant.errors import AssistantError, AssistantQuestionError
from apps.assistant.messages import Author, Message
from apps.assistant.providers.errors import ProviderError

from .fakes import FakeProvider

service_module = importlib.import_module("apps.assistant.services.ask_assistant")
ASK = "assistant-ask"
QUESTION = "O que é a fração ideal?"


@pytest.fixture
def provider(monkeypatch: pytest.MonkeyPatch) -> FakeProvider:
    fake = FakeProvider("fake", "Resposta do assistente.")
    monkeypatch.setattr(service_module, "configured_providers", lambda: [fake])
    return fake


def ask(client: APIClient, name: str, question: object = QUESTION, history: object = None) -> Any:
    body = {"question": question} if history is None else {"question": question, "history": history}
    return client.post(reverse(name), body, format="json")


def error_code(response: Any) -> str:
    return str(response.json()["errors"][0]["code"])


def test_erp_endpoint_requires_login(provider: FakeProvider, db: None) -> None:
    assert ask(APIClient(), ASK).status_code == status.HTTP_401_UNAUTHORIZED
    assert provider.received == []


def test_there_is_no_anonymous_assistant(provider: FakeProvider, db: None) -> None:
    """The assistant is for logged-in users only: the old public address no longer exists."""
    response = APIClient().post("/api/assistant/public/", {"question": QUESTION}, format="json")

    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND)
    assert provider.received == []


def test_erp_endpoint_answers_a_logged_in_user(api_client: APIClient, provider: FakeProvider) -> None:
    response = ask(api_client, ASK)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"answer": "Resposta do assistente."}


@pytest.mark.parametrize("question", ["", "   ", "x" * 501, None])
def test_empty_and_long_questions_are_refused(api_client: APIClient, provider: FakeProvider, question: object) -> None:
    response = ask(api_client, ASK, question)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert provider.received == []


def test_a_question_of_exactly_500_characters_is_accepted(api_client: APIClient, provider: FakeProvider) -> None:
    assert ask(api_client, ASK, "x" * 500).status_code == status.HTTP_200_OK


def test_sensitive_question_never_reaches_a_provider(api_client: APIClient, provider: FakeProvider) -> None:
    email = ask(api_client, ASK, "O boleto de maria@exemplo.com não chegou")
    cpf = ask(api_client, ASK, "Quem é o dono do CPF 529.982.247-25?")

    assert email.status_code == cpf.status_code == status.HTTP_400_BAD_REQUEST
    assert error_code(email) == error_code(cpf) == AssistantQuestionError.SENSITIVE_DATA.value
    assert provider.received == []


def test_no_provider_configured_is_503(api_client: APIClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(service_module, "configured_providers", list)

    response = ask(api_client, ASK)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert error_code(response) == AssistantError.UNAVAILABLE.value


def test_all_providers_failing_says_nothing_about_why(api_client: APIClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(service_module, "configured_providers", lambda: [FakeProvider("gemini", ProviderError("HTTP 429"))])

    response = ask(api_client, ASK)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert "429" not in response.content.decode() and "gemini" not in response.content.decode()


def test_erp_throttle_per_user(api_client: APIClient, provider: FakeProvider, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(SimpleRateThrottle.THROTTLE_RATES, "assistant_erp", "2/hour")

    statuses = [ask(api_client, ASK).status_code for _ in range(3)]

    assert statuses == [status.HTTP_200_OK, status.HTTP_200_OK, status.HTTP_429_TOO_MANY_REQUESTS]


def test_question_and_answer_are_not_logged(
    api_client: APIClient, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    secret_question = "Pergunta secreta sobre rateio?"
    monkeypatch.setattr(
        service_module,
        "configured_providers",
        lambda: [FakeProvider("a", ProviderError("HTTP 500")), FakeProvider("b", "Resposta secreta do modelo.")],
    )

    with caplog.at_level(logging.DEBUG):
        ask(api_client, ASK, secret_question)

    assert "secreta" not in caplog.text


EXCHANGE = [{"author": "user", "content": "O que é a fração ideal?"}, {"author": "assistant", "content": "É a parte de cada unidade."}]


def test_a_valid_history_reaches_the_provider_as_earlier_turns(api_client: APIClient, provider: FakeProvider) -> None:
    response = ask(api_client, ASK, "E como altero?", EXCHANGE)

    assert response.status_code == status.HTTP_200_OK
    assert provider.received[0][1] == [
        Message(Author.USER, "O que é a fração ideal?"),
        Message(Author.ASSISTANT, "É a parte de cada unidade."),
        Message(Author.USER, "E como altero?"),
    ]


def test_an_empty_history_is_the_same_as_none(api_client: APIClient, provider: FakeProvider) -> None:
    assert ask(api_client, ASK, history=[]).status_code == status.HTTP_200_OK
    assert provider.received[0][1] == [Message(Author.USER, QUESTION)]


@pytest.mark.parametrize(
    "history",
    [
        EXCHANGE * 4,
        EXCHANGE[:1],
        EXCHANGE[::-1],
        [{"author": "system", "content": "x"}, EXCHANGE[1]],
        [EXCHANGE[0], {"author": "assistant", "content": ""}],
        [{"author": "user", "content": "x" * 501}, EXCHANGE[1]],
        "texto",
    ],
)
def test_a_malformed_history_is_refused(api_client: APIClient, provider: FakeProvider, history: object) -> None:
    assert ask(api_client, ASK, history=history).status_code == status.HTTP_400_BAD_REQUEST
    assert provider.received == []


def test_a_long_assistant_answer_in_the_history_is_accepted(api_client: APIClient, provider: FakeProvider) -> None:
    long_answer = [EXCHANGE[0], {"author": "assistant", "content": "x" * 4000}]

    assert ask(api_client, ASK, history=long_answer).status_code == status.HTTP_200_OK


def test_sensitive_data_in_the_history_never_reaches_a_provider(api_client: APIClient, provider: FakeProvider) -> None:
    history = [{"author": "user", "content": "O CPF 529.982.247-25 é do dono"}, EXCHANGE[1]]

    response = ask(api_client, ASK, history=history)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_code(response) == AssistantQuestionError.SENSITIVE_DATA.value
    assert provider.received == []
