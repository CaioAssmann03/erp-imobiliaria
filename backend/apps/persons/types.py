from typing import NotRequired, TypedDict


class IndividualData(TypedDict):
    cpf: str
    rg: NotRequired[str | None]
    birthday: NotRequired[str | None]
    marital_status: NotRequired[str | None]
    job: NotRequired[str | None]


class LegalData(TypedDict):
    cnpj: str
    ie: NotRequired[str | None]


class PersonValidatedData(TypedDict):
    name: str
    home_phone: NotRequired[str | None]
    business_phone: NotRequired[str | None]
    cell_number: NotRequired[str | None]
    email: NotRequired[str]
    active: NotRequired[bool]

    people_individual: NotRequired[IndividualData]
    people_legal: NotRequired[LegalData]
