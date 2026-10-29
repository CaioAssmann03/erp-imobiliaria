from django.template.loader import render_to_string

from apps.billing.infrastructure.rendering.boleto_template import template_context
from apps.billing.models import BillingDocument
from apps.core.infrastructure.pdf import render_pdf

TEMPLATE = "billing/boleto_draft.html"


def render_billing_document_pdf(document: BillingDocument) -> bytes:
    """The draft boleto of a document as PDF bytes (the renderer loads nothing from outside, see `render_pdf`)."""
    return render_pdf(render_to_string(TEMPLATE, template_context(document)))
