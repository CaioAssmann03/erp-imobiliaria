import json

import pytest

from apps.assistant.messages import Author, Message
from apps.assistant.providers import transport
from apps.assistant.providers.errors import ProviderError
from apps.assistant.providers.gemini import GeminiClient
from apps.assistant.providers.groq import GroqClient

from .fakes import NETWORK_ERROR, FakePool, FakeResponse


def reply(status: int, body: object) -> FakeResponse:
    return FakeResponse(status, json.dumps(body).encode())


def test_gemini_sends_the_key_in_a_header_and_reads_the_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    pool = FakePool(reply(200, {"candidates": [{"content": {"parts": [{"text": " Olá "}, {"text": "mundo"}]}}]}))
    monkeypatch.setattr(transport, "_pool", pool)

    answer = GeminiClient(api_key="secret-key", model="m").answer("rules", [Message(Author.USER, "pergunta?")])

    call = pool.calls[0]
    body = json.loads(call["body"])
    assert answer == "Olá mundo"
    assert call["url"].endswith("/models/m:generateContent")
    assert call["headers"]["x-goog-api-key"] == "secret-key"
    assert "secret-key" not in call["url"]
    assert body["systemInstruction"]["parts"][0]["text"] == "rules"
    assert body["contents"][0]["parts"][0]["text"] == "pergunta?"
    assert body["generationConfig"]["maxOutputTokens"] == transport.MAXIMUM_OUTPUT_TOKENS


def test_groq_sends_the_key_as_bearer_and_reads_the_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    pool = FakePool(reply(200, {"choices": [{"message": {"content": "Resposta"}}]}))
    monkeypatch.setattr(transport, "_pool", pool)

    answer = GroqClient(api_key="secret-key", model="m").answer("rules", [Message(Author.USER, "pergunta?")])

    call = pool.calls[0]
    body = json.loads(call["body"])
    assert answer == "Resposta"
    assert call["headers"]["Authorization"] == "Bearer secret-key"
    assert body["messages"] == [{"role": "system", "content": "rules"}, {"role": "user", "content": "pergunta?"}]
    assert body["max_tokens"] == transport.MAXIMUM_OUTPUT_TOKENS


@pytest.mark.parametrize(("model", "expects_low_reasoning"), [("openai/gpt-oss-120b", True), ("some/other-model", False)])
def test_groq_asks_for_low_reasoning_only_from_models_that_take_it(
    monkeypatch: pytest.MonkeyPatch, model: str, expects_low_reasoning: bool
) -> None:
    pool = FakePool(reply(200, {"choices": [{"message": {"content": "ok"}}]}))
    monkeypatch.setattr(transport, "_pool", pool)

    GroqClient(api_key="k", model=model).answer("rules", [Message(Author.USER, "pergunta?")])

    assert ("reasoning_effort" in json.loads(pool.calls[0]["body"])) is expects_low_reasoning


@pytest.mark.parametrize(
    "response",
    [
        FakeResponse(429, b"{}"),
        FakeResponse(503, b"{}"),
        FakeResponse(400, b"{}"),
        FakeResponse(200, b"not json"),
        FakeResponse(200, b"[]"),
        FakeResponse(200, b"{}"),
        reply(200, {"candidates": [{"content": {"parts": [{"text": "   "}]}}]}),
        NETWORK_ERROR,
    ],
)
def test_response_parsing_and_errors(monkeypatch: pytest.MonkeyPatch, response: FakeResponse | Exception) -> None:
    monkeypatch.setattr(transport, "_pool", FakePool(response))

    with pytest.raises(ProviderError) as error:
        GeminiClient(api_key="secret-key", model="m").answer("rules", [Message(Author.USER, "pergunta?")])

    assert "secret-key" not in str(error.value)
    assert "pergunta" not in str(error.value)


def test_a_client_without_key_or_model_is_not_configured() -> None:
    assert not GeminiClient(api_key="", model="m").is_configured
    assert not GroqClient(api_key="k", model="").is_configured
    assert GroqClient(api_key="k", model="m").is_configured


HISTORY = [Message(Author.USER, "O que é a fração ideal?"), Message(Author.ASSISTANT, "É a parte de cada unidade."), Message(Author.USER, "E como altero?")]


def test_gemini_sends_the_history_as_user_and_model_turns(monkeypatch: pytest.MonkeyPatch) -> None:
    pool = FakePool(reply(200, {"candidates": [{"content": {"parts": [{"text": "ok"}]}}]}))
    monkeypatch.setattr(transport, "_pool", pool)

    GeminiClient(api_key="k", model="m").answer("rules", HISTORY)

    contents = json.loads(pool.calls[0]["body"])["contents"]
    assert [(turn["role"], turn["parts"][0]["text"]) for turn in contents] == [
        ("user", "O que é a fração ideal?"),
        ("model", "É a parte de cada unidade."),
        ("user", "E como altero?"),
    ]


def test_groq_sends_the_history_as_user_and_assistant_turns(monkeypatch: pytest.MonkeyPatch) -> None:
    pool = FakePool(reply(200, {"choices": [{"message": {"content": "ok"}}]}))
    monkeypatch.setattr(transport, "_pool", pool)

    GroqClient(api_key="k", model="m").answer("rules", HISTORY)

    assert json.loads(pool.calls[0]["body"])["messages"] == [
        {"role": "system", "content": "rules"},
        {"role": "user", "content": "O que é a fração ideal?"},
        {"role": "assistant", "content": "É a parte de cada unidade."},
        {"role": "user", "content": "E como altero?"},
    ]
