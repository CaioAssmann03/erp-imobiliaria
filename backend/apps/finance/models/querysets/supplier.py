from apps.core.models import SoftDeleteQuerySet


class SupplierQuerySet(SoftDeleteQuerySet["Supplier"]):
    """The manager of `Supplier`: archived suppliers are hidden by `Supplier.objects`."""
