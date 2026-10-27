from typing import Never

from django.template.loader import render_to_string
from weasyprint import HTML  # pyright: ignore[reportMissingTypeStubs]

from apps.billing.infrastructure.rendering.boleto_template import template_context
from apps.billing.models import BillingDocument

TEMPLATE = "billing/boleto_draft.html"


def render_billing_document_pdf(document: BillingDocument) -> bytes:
    """The draft boleto of a document as PDF bytes.

    The renderer refuses every URL (images, fonts, stylesheets): rendering never reaches the network or
    the file system, whatever the document's text contains.
    """
    html = render_to_string(TEMPLATE, template_context(document))
    content: bytes = HTML(string=html, url_fetcher=_refuse_every_url).write_pdf()
    return content


def _refuse_every_url(url: str, *args: object, **kwargs: object) -> Never:
    raise ValueError(f"The boleto PDF does not load external resources: {url}")
