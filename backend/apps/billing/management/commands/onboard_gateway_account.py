from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser

from apps.billing.infrastructure.gateway.asaas_client import GatewayError
from apps.billing.services.onboard_condominium_at_gateway import GatewayApplicant, onboard_condominium_at_gateway
from apps.condominiums.models import Condominium


class Command(BaseCommand):
    help = "Create the Asaas sub-account of a condominium and store its credentials encrypted (spec 030)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("condominium_code")
        parser.add_argument("--email", required=True)
        parser.add_argument("--mobile-phone", required=True)
        parser.add_argument("--monthly-income", type=Decimal, required=True)
        parser.add_argument("--company-type", default="ASSOCIATION", help="MEI, LIMITED, INDIVIDUAL or ASSOCIATION")
        parser.add_argument("--yes", action="store_true", help="Confirm outside the sandbox (the gateway charges a fee per sub-account)")

    def handle(self, *args: Any, **options: Any) -> None:
        if "sandbox" not in settings.ASAAS_BASE_URL and not options["yes"]:
            raise CommandError("Production creates a sub-account with a fixed fee; pass --yes to confirm.")
        try:
            condominium = Condominium.objects.get(code=options["condominium_code"])
        except Condominium.DoesNotExist:
            raise CommandError("Condominium not found.") from None
        applicant = GatewayApplicant(
            email=options["email"],
            mobile_phone=options["mobile_phone"],
            monthly_income=options["monthly_income"],
            company_type=options["company_type"],
        )
        try:
            account = onboard_condominium_at_gateway(condominium, applicant)
        except GatewayError as error:
            raise CommandError(str(error)) from None
        self.stdout.write(f"{account.condominium}: {account.status}")
