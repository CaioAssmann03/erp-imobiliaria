"""The draft boleto: Brazilian formats, the printed terms and the rendered PDF (spec 027, R1, R2, R6)."""

from datetime import date
from decimal import Decimal

import pytest
from django.template.loader import render_to_string

from apps.billing.models import CondominiumBillingRules
from apps.billing.infrastructure.rendering import boleto_template

from ..models import BillingDocument
from apps.core.infrastructure import formatting
from apps.core.infrastructure.pdf import _refuse_every_url

from ..services.render_billing_document_pdf import TEMPLATE, render_billing_document_pdf

pytestmark = pytest.mark.django_db


def test_money_is_written_the_brazilian_way() -> None:
    assert formatting.format_money(Decimal("1234567.5")) == "R$ 1.234.567,50"
    assert formatting.format_money(Decimal("0.05")) == "R$ 0,05"


def test_percentages_drop_empty_cents() -> None:
    assert boleto_template.format_percentage(Decimal("2.00")) == "2%"
    assert boleto_template.format_percentage(Decimal("1.50")) == "1,50%"


def test_documents_and_months_are_formatted() -> None:
    assert boleto_template.format_cpf_cnpj("12345678909") == "123.456.789-09"
    assert boleto_template.format_cpf_cnpj("11222333000181") == "11.222.333/0001-81"
    assert formatting.format_month(date(2026, 3, 1)) == "março/2026"
    assert formatting.format_date(date(2026, 10, 5)) == "05/10/2026"


def printed(document: BillingDocument) -> str:
    return render_to_string(TEMPLATE, boleto_template.template_context(document))


def test_the_page_names_everyone_and_everything_it_charges(document: BillingDocument) -> None:
    page = printed(document)

    for text in ("Residencial Sol", "11.222.333/0001-81", "Maria Souza", "101", "outubro/2026", "10/10/2026", "R$ 450,00"):
        assert text in page
    assert "Taxa condominial" in page and "Taxa Ordinária" in page and "R$ 400,00" in page and "R$ 50,00" in page


def test_the_page_is_a_draft_without_bank_data(document: BillingDocument) -> None:
    page = printed(document)

    assert "RASCUNHO" in page
    assert "Sem valor para pagamento" in page
    assert "aparecem quando o título for registrado" in page


def test_the_terms_come_from_the_document(document: BillingDocument) -> None:
    assert boleto_template.payment_terms(document) == [
        "Desconto de 5% para pagamento até 3 dias antes do vencimento.",
        "Multa de 2% após o vencimento.",
        "Juros de 1% ao mês, cobrados pelo mês cheio, após 1 dia de tolerância.",
    ]


def test_the_first_days_fine_and_per_day_interest_are_described(document: BillingDocument) -> None:
    document.initial_late_fee_percentage = Decimal("1.00")
    document.initial_late_fee_days = 5
    document.interest_calculation = CondominiumBillingRules.InterestCalculation.PER_DAY
    document.interest_grace_days = 0
    document.discount_percentage = Decimal(0)

    assert boleto_template.payment_terms(document) == [
        "Multa de 1% nos primeiros 5 dias de atraso e de 2% depois.",
        "Juros de 1% ao mês, calculados por dia de atraso.",
    ]


def test_text_typed_by_staff_is_escaped(document: BillingDocument) -> None:
    document.payer.name = '<img src="http://attacker.invalid/x.png">'

    page = printed(document)

    assert "<img" not in page
    assert "&lt;img" in page


def test_rendering_produces_a_pdf(document: BillingDocument) -> None:
    content = render_billing_document_pdf(document)

    assert content.startswith(b"%PDF")
    assert len(content) > 1000


def test_rendering_refuses_every_url() -> None:
    with pytest.raises(ValueError, match="external resources"):
        _refuse_every_url("http://attacker.invalid/logo.png")
