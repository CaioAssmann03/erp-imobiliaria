import pytest

from apps.assistant.sensitive_data import SensitiveData, find_sensitive_data


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("meu e-mail é maria@exemplo.com.br", [SensitiveData.EMAIL]),
        ("o CPF 529.982.247-25 da moradora", [SensitiveData.NUMBER]),
        ("cpf 52998224725", [SensitiveData.NUMBER]),
        ("CNPJ 11.222.333/0001-81", [SensitiveData.NUMBER]),
        ("ligue (11) 98765-4321", [SensitiveData.NUMBER]),
        ("tel +55 11 98765 4321", [SensitiveData.NUMBER]),
        ("linha 23790.12345 12345.678901 12345.678901 1 12345678901234", [SensitiveData.NUMBER]),
        ("cartão 4111 1111 1111 1111", [SensitiveData.NUMBER]),
        ("maria@exemplo.com e 52998224725", [SensitiveData.EMAIL, SensitiveData.NUMBER]),
    ],
)
def test_finds_email_cpf_cnpj_phone_boleto_and_card(text: str, expected: list[SensitiveData]) -> None:
    assert find_sensitive_data(text) == expected


@pytest.mark.parametrize(
    "text",
    [
        "O que é a fração ideal?",
        "A unidade 101 do bloco 2 pode ter dois critérios?",
        "Para que serve o evento 0052?",
        "Vence em 01/02/2026 10:30, o que acontece?",
        "Como lançar R$ 1.234,56 em 6 parcelas?",
        "CEP 01310-100, onde digito?",
        "Qual o limite da multa de 2%?",
    ],
)
def test_ordinary_numbers_pass(text: str) -> None:
    assert find_sensitive_data(text) == []
