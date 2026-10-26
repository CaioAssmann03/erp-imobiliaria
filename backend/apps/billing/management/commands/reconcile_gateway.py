from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser

from apps.billing.models import GatewayAccount
from apps.billing.services.reconcile_gateway_account import reconcile_gateway_account


class Command(BaseCommand):
    help = "Reconcile the gateway's received payments with the posted ones (spec 033); use a longer --days after a webhook outage."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--days", type=int, default=settings.GATEWAY_RECONCILIATION_WINDOW_DAYS)

    def handle(self, *args: Any, **options: Any) -> None:
        for account in GatewayAccount.objects.filter(status=GatewayAccount.Status.ACTIVE):
            run = reconcile_gateway_account(account, options["days"])
            self.stdout.write(
                f"{account.company}: {run.status} found={run.found_count} posted={run.processed_count} "
                f"already={run.already_posted_count} unprocessed={run.unprocessed_count}"
            )
