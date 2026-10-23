import datetime
from collections.abc import Collection
from decimal import Decimal
from typing import Any, Self, final, override

from django.conf import settings
from django.db import models
from django.db.models import Func, Q, Value

from apps.condominiums.models import Unit
from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import CurrentAccountEntryError
from apps.finance.models.querysets import CurrentAccountEntryQuerySet
from apps.finance.models.rules import CurrentAccountEntryRules
from apps.finance.validators import validate_positive_amount

from .account_payable import AccountPayable
from .cost_center import CostCenter
from .current_account import CurrentAccount
from .entry_batch import EntryBatch
from .entry_template import EntryTemplate

REGISTRY_SEQUENCE = "current_account_entry_registry_seq"


@final
class CurrentAccountEntry(BaseModel):
    objects = CurrentAccountEntryQuerySet.as_manager()

    class Kind(models.TextChoices):
        CREDIT = ("credit", "Credit")
        DEBIT = ("debit", "Debit")

    class Origin(models.TextChoices):
        MANUAL = ("manual", "Manual")
        AUTOMATIC_PAYABLE = ("automatic_payable", "Automatic (account payable)")
        AUTOMATIC_BILLING = ("automatic_billing", "Automatic (billing document)")

    company = models.ForeignKey(
        Company, on_delete=models.PROTECT, related_name="current_account_entries"
    )
    current_account = models.ForeignKey(
        CurrentAccount, on_delete=models.PROTECT, related_name="entries"
    )
    batch = models.ForeignKey(
        EntryBatch, on_delete=models.PROTECT, related_name="entries"
    )
    entry_template = models.ForeignKey(
        EntryTemplate, on_delete=models.PROTECT, related_name="entries"
    )
    cost_center = models.ForeignKey(
        CostCenter, on_delete=models.PROTECT, related_name="entries"
    )
    # Set when the entry is about one unit (for example a water apportionment); empty for the whole condominium.
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, null=True, blank=True, related_name="ledger_entries")

    entry_date = models.DateField()
    competence_month = models.DateField(
        help_text="First day of the month the entry refers to"
    )
    kind = models.CharField(max_length=6, choices=Kind.choices)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[validate_positive_amount]
    )
    description = models.CharField(max_length=255)
    # The reason of a reversal, required then (spec 039); a manual entry no longer needs one, and an old one keeps its own.
    justification = models.TextField(blank=True)

    origin = models.CharField(max_length=20, choices=Origin.choices, default=Origin.MANUAL)
    account_payable = models.ForeignKey(
        AccountPayable,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    # The billing document item whose payment this entry records (spec 032); at most one entry per item.
    billing_document_item = models.ForeignKey(
        "billing.BillingDocumentItem",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    # The opposite entry that cancels this one; set only on the reversal, at most one per entry.
    reversal_of = models.OneToOneField(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reversal",
    )

    registry = models.BigIntegerField(
        unique=True,
        editable=False,
        db_default=Func(Value(REGISTRY_SEQUENCE), function="nextval"),
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        editable=False,
        null=True,
        related_name="+",
    )

    company_lookup = "company"

    class Meta:
        verbose_name = "Current Account Entry"
        verbose_name_plural = "Current Account Entries"
        ordering = ("registry",)
        constraints = (
            models.CheckConstraint(
                name="current_account_entry_amount_positive",
                condition=Q(amount__gt=0),
                violation_error_message=CurrentAccountEntryError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=CurrentAccountEntryError.AMOUNT_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="current_account_entry_account_payable_matches_origin",
                condition=(Q(origin="automatic_payable") & Q(account_payable__isnull=False))
                | (~Q(origin="automatic_payable") & Q(account_payable__isnull=True)),
                violation_error_message=CurrentAccountEntryError.ACCOUNT_PAYABLE_MATCHES_ORIGIN.message,
                violation_error_code=CurrentAccountEntryError.ACCOUNT_PAYABLE_MATCHES_ORIGIN.value,
            ),
            models.CheckConstraint(
                name="current_account_entry_reversal_has_justification",
                condition=Q(reversal_of__isnull=True) | ~Q(justification=""),
                violation_error_message=CurrentAccountEntryError.JUSTIFICATION_BLANK.message,
                violation_error_code=CurrentAccountEntryError.JUSTIFICATION_BLANK.value,
            ),
            models.CheckConstraint(
                name="current_account_entry_billing_item_matches_origin",
                condition=(Q(origin="automatic_billing") & Q(billing_document_item__isnull=False))
                | (~Q(origin="automatic_billing") & Q(billing_document_item__isnull=True)),
                violation_error_message=CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_MATCHES_ORIGIN.message,
                violation_error_code=CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_MATCHES_ORIGIN.value,
            ),
            models.CheckConstraint(
                name="current_account_entry_created_by_required_unless_automatic_billing",
                condition=Q(created_by__isnull=False) | Q(origin="automatic_billing"),
                violation_error_message=CurrentAccountEntryError.CREATED_BY_REQUIRED.message,
                violation_error_code=CurrentAccountEntryError.CREATED_BY_REQUIRED.value,
            ),
            models.UniqueConstraint(
                fields=("billing_document_item",),
                condition=Q(billing_document_item__isnull=False),
                name="current_account_entry_unique_per_billing_document_item",
                violation_error_message=CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_ALREADY_POSTED.message,
                violation_error_code=CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_ALREADY_POSTED.value,
            ),
            models.UniqueConstraint(
                fields=("account_payable",),
                condition=Q(account_payable__isnull=False),
                name="current_account_entry_unique_per_account_payable",
                violation_error_message=CurrentAccountEntryError.ACCOUNT_PAYABLE_ALREADY_POSTED.message,
                violation_error_code=CurrentAccountEntryError.ACCOUNT_PAYABLE_ALREADY_POSTED.value,
            ),
        )

    @classmethod
    def paying(cls, account_payable: AccountPayable, current_account: CurrentAccount, batch: EntryBatch) -> Self:
        """The debit that paying an account payable posts (not saved; the service sets `created_by`).

        The description is built from the supplier and the cost center, never typed.
        """
        cost_center = account_payable.cost_center
        assert cost_center is not None
        assert account_payable.payment_date is not None and account_payable.amount_paid is not None
        description = f"{account_payable.supplier.person.name} - {cost_center.name}"
        return cls(
            company=account_payable.company,
            current_account=current_account,
            batch=batch,
            entry_template=account_payable.entry_template,
            cost_center=account_payable.cost_center,
            entry_date=account_payable.payment_date,
            competence_month=account_payable.due_date.replace(day=1),
            kind=cls.Kind.DEBIT,
            amount=account_payable.amount_paid,
            description=description[:255],
            origin=cls.Origin.AUTOMATIC_PAYABLE,
            account_payable=account_payable,
        )

    @classmethod
    def receiving(cls, item: Any, current_account: CurrentAccount, batch: EntryBatch, paid_on: datetime.date) -> Self:
        """The credit that the payment of a billing document item posts (not saved; it has no user).

        `item` is a `billing.BillingDocumentItem`: its cost center and entry template say where the money
        goes, the document says the unit and the competence month. The description is never typed.
        """
        document = item.document
        return cls(
            company=current_account.company,
            current_account=current_account,
            batch=batch,
            entry_template=item.entry_template,
            cost_center=item.cost_center,
            unit=document.unit,
            entry_date=paid_on,
            competence_month=document.competence_month,
            kind=cls.Kind.CREDIT,
            amount=item.amount,
            description=f"{document.unit} - {item.description}"[:255],
            origin=cls.Origin.AUTOMATIC_BILLING,
            billing_document_item=item,
        )

    @classmethod
    def reversing(cls, original: Self, reason: str, entry_date: datetime.date) -> Self:
        """The opposite entry that cancels `original` (not saved; the service sets `created_by`)."""
        opposite_kind = cls.Kind.CREDIT if original.kind == cls.Kind.DEBIT else cls.Kind.DEBIT
        return cls(
            company=original.company,
            current_account=original.current_account,
            batch=original.batch,
            entry_template=original.entry_template,
            cost_center=original.cost_center,
            unit=original.unit,
            entry_date=entry_date,
            competence_month=original.competence_month,
            kind=opposite_kind,
            amount=original.amount,
            description=f"Reversal of {original.registry}: {original.description}"[:255],
            justification=reason,
            origin=cls.Origin.MANUAL,
            reversal_of=original,
        )

    @property
    def signed_amount(self) -> Decimal:
        if self.kind == self.Kind.CREDIT:
            return self.amount
        return -self.amount

    @override
    def validate_unique(self, exclude: Collection[str] | None = None) -> None:
        # `registry` comes from the database sequence and is unique by construction. Django's own check
        # would run `registry = <default>`, and evaluating that default draws a number from the sequence
        # on every validation (a statement with holes).
        super().validate_unique(exclude={*(exclude or ()), "registry"})

    @override
    def clean(self) -> None:
        CurrentAccountEntryRules(self).validate()

    @override
    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding:
            raise CurrentAccountEntryError.UPDATE_NOT_ALLOWED.to_validation_error()
        super().save(*args, **kwargs)

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise CurrentAccountEntryError.DELETION_NOT_ALLOWED.to_validation_error()

    @override
    def __str__(self) -> str:
        return f"{self.registry} - {self.current_account} - {self.kind} {self.amount}"
