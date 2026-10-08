import re
from typing import NamedTuple

MIN_TEXT_LENGTH = 3  # o índice trigram só é eficiente a partir de 3 caracteres
MIN_NUMERIC_LENGTH = 2  # números curtos (ex.: unidade "12") são válidos

# Termo "de documento/número": só dígitos e a pontuação de CPF/CNPJ.
NUMERIC_TERM = re.compile(r"^[\d.\-/\s]+$")


class ClassifiedTerm(NamedTuple):
    is_searchable: bool
    digits: str  # só quando o termo é numérico; vazio caso contrário


def classify_term(term: str) -> ClassifiedTerm:
    if NUMERIC_TERM.match(term):
        digits = re.sub(r"\D", "", term)
        return ClassifiedTerm(len(digits) >= MIN_NUMERIC_LENGTH, digits)
    return ClassifiedTerm(len(term) >= MIN_TEXT_LENGTH, "")
