from typing import TYPE_CHECKING

from apps.core.models import SoftDeleteQuerySet

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.finance.models.supplier import Supplier  # noqa: F401


class SupplierQuerySet(SoftDeleteQuerySet["Supplier"]):
    """The manager of `Supplier`: archived suppliers are hidden by `Supplier.objects`."""
