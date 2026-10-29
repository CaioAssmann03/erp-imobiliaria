from django.db import transaction

from apps.billing.models import BillingDocument
from config.celery import app as celery_app


def schedule_billing_document_tasks(document: BillingDocument, registers_at_gateway: bool) -> None:
    """Once the unit's transaction has committed: generate the document's PDF and, with an active account, register it.

    The tasks are sent by name: `tasks.py` imports the services.
    """
    document_id = str(document.pk)
    transaction.on_commit(
        lambda: celery_app.send_task("apps.billing.tasks.generate_billing_document_pdf_task", args=[document_id])
    )
    if registers_at_gateway:
        transaction.on_commit(
            lambda: celery_app.send_task("apps.billing.tasks.register_billing_document_task", args=[document_id])
        )
