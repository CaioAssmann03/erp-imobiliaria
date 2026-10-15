import re
from typing import NamedTuple

from apps.core.api.codes import code_from_term

MIN_TEXT_LENGTH = 3  # o índice trigram só é eficiente a partir de 3 caracteres
MIN_NUMERIC_LENGTH = 2  # números curtos (ex.: unidade "12") são válidos
MIN_DOCUMENT_DIGITS = 3  # abaixo disso só o nome (e o ID) é pesquisado

# Termo "de documento/número": só dígitos e a pontuação de CPF/CNPJ.
NUMERIC_TERM = re.compile(r"^[\d.\-/\s]+$")


class ClassifiedTerm(NamedTuple):
    text: str
    is_searchable: bool
    digits: str  # só quando o termo é numérico; vazio caso contrário
    code: int | None  # o ID pedido, quando o termo é só de dígitos (spec 019)
    matches_text: bool  # um dígito sozinho casaria com quase todo nome: só o ID vale
    matches_document: bool


def classify_term(term: str) -> ClassifiedTerm:
    code = code_from_term(term)
    if NUMERIC_TERM.match(term):
        digits = re.sub(r"\D", "", term)
        # Um único dígito é uma busca por ID; com a pontuação de CPF/CNPJ continua sendo documento.
        is_single_digit_id = code is not None and len(digits) < MIN_NUMERIC_LENGTH
        return ClassifiedTerm(
            text=term,
            is_searchable=len(digits) >= MIN_NUMERIC_LENGTH or is_single_digit_id,
            digits=digits,
            code=code,
            matches_text=not is_single_digit_id,
            matches_document=len(digits) >= MIN_DOCUMENT_DIGITS,
        )
    return ClassifiedTerm(
        text=term,
        is_searchable=len(term) >= MIN_TEXT_LENGTH,
        digits="",
        code=None,
        matches_text=True,
        matches_document=False,
    )
