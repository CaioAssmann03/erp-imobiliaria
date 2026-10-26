from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from django.db import transaction

from apps.billing.models import BillingDocument, BillingDocumentItem, BillingEntry
from apps.condominiums.models import Unit
from apps.finance.models import CostCenter, EntryTemplate
from apps.persons.models import Person


@dataclass(frozen=True)
class NewBillingDocumentItem:
    description: str
    cost_center: CostCenter
    entry_template: EntryTemplate
    amount: Decimal
    billing_entry: BillingEntry | None = None


@dataclass(frozen=True)
class NewBillingDocument:
    unit: Unit
    payer: Person
    reference_month: date
    competence_month: date
    due_date: date
    items: tuple[NewBillingDocumentItem, ...]


@transaction.atomic
def create_billing_document(new_document: NewBillingDocument) -> BillingDocument:
    """Issue a unit's document with its items, all or none.

    The amount is the sum of the items and the late-payment and discount terms are copied from the
    condominium's billing rules (the interest rate in force on the due date). The condominium must have
    billing rules: the monthly issuance checks that before it gets here.
    """
    condominium = new_document.unit.condominium
    billing_rules = condominium.billing_rules
    late_interest_rate = condominium.late_interest_rates.in_force_on(new_document.due_date)
    document = BillingDocument(
        unit=new_document.unit,
        payer=new_document.payer,
        reference_month=new_document.reference_month,
        competence_month=new_document.competence_month,
        due_date=new_document.due_date,
        amount=sum((item.amount for item in new_document.items), Decimal(0)),
        discount_percentage=billing_rules.early_payment_discount_percentage,
        discount_days=billing_rules.early_payment_discount_days,
        late_fee_percentage=billing_rules.late_fee_percentage,
        initial_late_fee_percentage=billing_rules.initial_late_fee_percentage,
        initial_late_fee_days=billing_rules.initial_late_fee_days,
        interest_calculation=billing_rules.interest_calculation,
        interest_grace_days=billing_rules.interest_grace_days,
        monthly_interest_percentage=late_interest_rate.monthly_percentage if late_interest_rate else 0,
    )
    document.full_clean()
    document.save()
    for position, new_item in enumerate(new_document.items, start=1):
        item = BillingDocumentItem(
            document=document,
            position=position,
            description=new_item.description,
            cost_center=new_item.cost_center,
            entry_template=new_item.entry_template,
            amount=new_item.amount,
            billing_entry=new_item.billing_entry,
        )
        item.full_clean()
        item.save()
    document.full_clean()
    return document
