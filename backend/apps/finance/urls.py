from rest_framework.routers import DefaultRouter

from .views import (
    AccountPayableViewSet,
    BankAccountViewSet,
    CostCenterViewSet,
    CurrentAccountEntryViewSet,
    CurrentAccountViewSet,
    EntryBatchViewSet,
    EntryTemplateViewSet,
    PaymentReceiptViewSet,
    SupplierViewSet,
)

router = DefaultRouter()
router.register("cost-centers", CostCenterViewSet, basename="cost-center")
router.register("entry-templates", EntryTemplateViewSet, basename="entry-template")
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("bank-accounts", BankAccountViewSet, basename="bank-account")
router.register("current-accounts", CurrentAccountViewSet, basename="current-account")
router.register("entry-batches", EntryBatchViewSet, basename="entry-batch")
router.register("current-account-entries", CurrentAccountEntryViewSet, basename="current-account-entry")
router.register("payment-receipts", PaymentReceiptViewSet, basename="payment-receipt")
router.register("accounts-payable", AccountPayableViewSet, basename="account-payable")

urlpatterns = router.urls
