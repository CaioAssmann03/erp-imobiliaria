"""The e-mail that carries a registered boleto to its payer (spec 035): a link and the digitable line, no attachment."""

from django.utils.html import escape

from apps.billing.boleto_template import format_date, format_money, format_month
from apps.billing.models import BillingDocument, BillingDocumentRegistration


def build_boleto_email(document: BillingDocument, registration: BillingDocumentRegistration) -> tuple[str, str, str]:
    """The subject, the HTML and the plain text of the e-mail. Every value is escaped in the HTML."""
    condominium = document.unit.condominium.name
    due = format_date(registration.registered_due_date)
    subject = f"Boleto de {format_month(document.reference_month)} - {condominium}"
    lines = [
        f"Olá, {document.payer.name}.",
        f"Segue o boleto da unidade {document.unit} do {condominium}, referente a {format_month(document.reference_month)}.",
        f"Valor: {format_money(document.amount)}",
        f"Vencimento: {due}",
    ]
    links = []
    if registration.boleto_url:
        links.append(("Abrir o boleto", registration.boleto_url))
    codes = []
    if registration.digitable_line:
        codes.append(("Linha digitável", registration.digitable_line))
    if registration.pix_payload:
        codes.append(("Pix copia e cola", registration.pix_payload))

    text = "\n".join(
        [*lines, "", *(f"{label}: {url}" for label, url in links), *(f"{label}: {value}" for label, value in codes)]
    )
    html = "".join(
        [
            *(f"<p>{escape(line)}</p>" for line in lines),
            *(f'<p><a href="{escape(url)}">{escape(label)}</a></p>' for label, url in links),
            *(f"<p><strong>{escape(label)}:</strong><br><code>{escape(value)}</code></p>" for label, value in codes),
        ]
    )
    return subject, html, text
