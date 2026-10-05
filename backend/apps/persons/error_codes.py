"""Stable error codes of the people rules (spec 006): `model.field.reason`."""

from enum import StrEnum


class PersonsErrorCode(StrEnum):
    PEOPLE_INDIVIDUAL_COMPANY_MISMATCH = "people_individual.company.mismatch"
    PEOPLE_INDIVIDUAL_CPF_DUPLICATE_IN_COMPANY = "people_individual.cpf.duplicate_in_company"
    PEOPLE_INDIVIDUAL_RG_DUPLICATE_IN_COMPANY = "people_individual.rg.duplicate_in_company"
    PEOPLE_LEGAL_COMPANY_MISMATCH = "people_legal.company.mismatch"
    PEOPLE_LEGAL_CNPJ_DUPLICATE_IN_COMPANY = "people_legal.cnpj.duplicate_in_company"
