from getpass import getpass
from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser

from apps.billing.infrastructure.gateway.asaas_client import GatewayError
from apps.billing.services.register_gateway_webhook import register_gateway_webhook
from apps.billing.services.rotate_gateway_webhook_token import (
    rotate_gateway_webhook_token,
)
from apps.billing.services.set_up_gateway_account import set_up_gateway_account
from apps.core.models import Company


class Command(BaseCommand):
    help = "Store the company's Asaas API key (encrypted), activate its gateway account and optionally register the webhook (spec 037)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("company_id", help="The company's id")
        parser.add_argument(
            "--rotate-webhook-token",
            action="store_true",
            help="Generate a new webhook token",
        )
        parser.add_argument(
            "--register-webhook",
            metavar="EMAIL",
            help="Register ASAAS_WEBHOOK_URL at the gateway; the e-mail is where it reports failures",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            company = Company.objects.get(pk=options["company_id"])
        except (Company.DoesNotExist, ValueError):
            raise CommandError("Company not found.") from None
        api_key = getpass("Asaas API key (not shown): ").strip()
        if not api_key:
            raise CommandError("No key given.")
        try:
            account = set_up_gateway_account(company, api_key)
            if options["rotate_webhook_token"]:
                account = rotate_gateway_webhook_token(account)
            if options["register_webhook"]:
                register_gateway_webhook(account, options["register_webhook"])
        except GatewayError as error:
            raise CommandError(str(error)) from None
        self.stdout.write(f"{account.company}: {account.status}")
        if not options["register_webhook"]:
            self.stdout.write(
                "Webhook token (paste it as the authentication token of the webhook in the Asaas panel):"
            )
            self.stdout.write(account.webhook_token)
