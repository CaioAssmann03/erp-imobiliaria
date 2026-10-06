import uuid

from django.db import models


class EntryBatch(models.Model):
    class EntryType(models.TextChoices):
        CASH = ("cash", "Cash")
        EXTRA_CASH = ("extra_cash", "ExtraCash")
        BANK = ("bank", "Bank")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    register = models.CharField(max_length=122, unique=True)
