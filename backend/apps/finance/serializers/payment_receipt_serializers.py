from rest_framework import serializers
from typing_extensions import final

from ..models import PaymentReceipt


class PaymentReceiptSerializer(serializers.ModelSerializer[PaymentReceipt]):
    uploaded_by_name = serializers.SerializerMethodField()

    @final
    class Meta:
        model = PaymentReceipt
        fields = (
            "id",
            "account_payable",
            "original_name",
            "content_type",
            "size_bytes",
            "uploaded_by",
            "uploaded_by_name",
            "confirmed_at",
            "created_at",
        )
        read_only_fields = fields

    def get_uploaded_by_name(self, receipt: PaymentReceipt) -> str:
        return receipt.uploaded_by.get_full_name() or receipt.uploaded_by.get_username()


class CreatePaymentReceiptSerializer(serializers.Serializer[None]):
    """The file the browser is about to upload; the rules (type, size, paid account) are the model's."""

    original_name = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=30)
    size_bytes = serializers.IntegerField()


class PaymentReceiptUploadSerializer(serializers.Serializer[None]):
    id = serializers.UUIDField()
    upload_url = serializers.URLField()
    upload_headers = serializers.DictField(child=serializers.CharField())
    expires_in = serializers.IntegerField()


class PaymentReceiptDownloadSerializer(serializers.Serializer[None]):
    download_url = serializers.URLField()
    expires_in = serializers.IntegerField()
