"""What the draft boleto template prints: Brazilian formats and the payment-terms sentences (spec 027)."""

from datetime import date
from decimal import Decimal
from typing import Any

from apps.billing.models import BillingDocument
from apps.condominiums.models import BillingRules
from apps.condominiums.models.address import Address
from apps.persons.models import Person

CPF_LENGTH = 11
CNPJ_LENGTH = 14

MONTH_NAMES = (
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
)


def format_money(amount: Decimal) -> str:
    whole, _, cents = f"{amount:,.2f}".partition(".")
    return f"R$ {whole.replace(',', '.')},{cents}"


def format_percentage(value: Decimal) -> str:
    return f"{value:.2f}".replace(".", ",").removesuffix(",00") + "%"


def format_days(days: int) -> str:
    return f"{days} dia" if days == 1 else f"{days} dias"


def format_date(value: date) -> str:
    return f"{value:%d/%m/%Y}"


def format_month(value: date) -> str:
    return f"{MONTH_NAMES[value.month - 1]}/{value.year}"


def format_cpf_cnpj(digits: str) -> str:
    if len(digits) == CPF_LENGTH:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    if len(digits) == CNPJ_LENGTH:
        return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"
    return digits


def payer_document(person: Person) -> str:
    """The payer's CPF or CNPJ formatted, or an empty text when the person has neither."""
    if hasattr(person, "people_individual"):
        return format_cpf_cnpj(person.people_individual.cpf)
    if hasattr(person, "people_legal"):
        return format_cpf_cnpj(person.people_legal.cnpj)
    return ""


def address_line(address: Address | None) -> str:
    if address is None:
        return ""
    street = ", ".join(part for part in (address.street, address.number, address.complement) if part)
    place = " - ".join(part for part in (address.district, address.city) if part)
    region = f"{place}/{address.state}" if place and address.state else place
    return " - ".join(part for part in (street, region) if part)


def payment_terms(document: BillingDocument) -> list[str]:
    """The instructions printed under the items, built only from the terms copied onto the document."""
    terms: list[str] = []
    if document.discount_percentage > 0:
        deadline = (
            f"até {format_days(document.discount_days)} antes do vencimento"
            if document.discount_days
            else "até o vencimento"
        )
        over_fee = " (sobre o valor sem a tarifa)" if document.fee_amount() > 0 else ""
        terms.append(f"Desconto de {format_percentage(document.discount_percentage)}{over_fee} para pagamento {deadline}.")
    if document.late_fee_percentage > 0:
        if document.initial_late_fee_percentage is not None and document.initial_late_fee_days:
            terms.append(
                f"Multa de {format_percentage(document.initial_late_fee_percentage)} nos primeiros "
                f"{format_days(document.initial_late_fee_days)} de atraso e de "
                f"{format_percentage(document.late_fee_percentage)} depois."
            )
        else:
            terms.append(f"Multa de {format_percentage(document.late_fee_percentage)} após o vencimento.")
    if document.monthly_interest_percentage > 0:
        counting = (
            "calculados por dia de atraso"
            if document.interest_calculation == BillingRules.InterestCalculation.PER_DAY
            else "cobrados pelo mês cheio"
        )
        grace = f", após {format_days(document.interest_grace_days)} de tolerância" if document.interest_grace_days else ""
        terms.append(f"Juros de {format_percentage(document.monthly_interest_percentage)} ao mês, {counting}{grace}.")
    return terms


def template_context(document: BillingDocument) -> dict[str, Any]:
    unit = document.unit
    condominium = unit.condominium
    company = condominium.company
    return {
        "administrator_name": company.legal_name,
        "administrator_cnpj": format_cpf_cnpj(company.cnpj),
        "beneficiary_name": condominium.name,
        "beneficiary_cnpj": format_cpf_cnpj(condominium.cnpj),
        "beneficiary_address": address_line(condominium.address),
        "payer_name": document.payer.name,
        "payer_document": payer_document(document.payer),
        "unit_label": f"{unit.block.name} - {unit.name}" if unit.block else unit.name,
        "reference_month": format_month(document.reference_month),
        "competence_month": format_month(document.competence_month),
        "due_date": format_date(document.due_date),
        "total": format_money(document.amount),
        "items": [
            {
                "description": item.description,
                "cost_center": item.cost_center.name if item.cost_center else "",
                "amount": format_money(item.amount),
            }
            for item in document.items.all()
        ],
        "payment_terms": payment_terms(document),
    }
