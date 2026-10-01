from django.db.models import Func, Value


def so_digitos(campo: str) -> Func:
    """Expressão SQL que remove tudo que não é dígito de uma coluna de texto.

    Usada nos índices (CPF/CNPJ com ou sem pontuação) e na busca; precisa ser exatamente a
    mesma expressão nos dois lugares para o Postgres reaproveitar o índice.
    """
    return Func(campo, Value(r"\D"), Value(""), Value("g"), function="regexp_replace")
