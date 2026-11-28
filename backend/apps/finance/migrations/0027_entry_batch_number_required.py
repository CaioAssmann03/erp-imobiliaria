import apps.finance.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    """Spec 073, step 3 of 3: every batch has its number, once per company."""

    dependencies = [("finance", "0026_number_existing_entry_batches")]

    operations = [
        migrations.AlterField(
            model_name="entrybatch",
            name="number",
            field=models.PositiveIntegerField(
                blank=True,
                validators=[apps.finance.validators.validate_positive_batch_number],
            ),
        ),
        migrations.AddConstraint(
            model_name="entrybatch",
            constraint=models.UniqueConstraint(
                fields=("company", "number"),
                name="entry_batch_unique_number_per_company",
                violation_error_code="entry_batch.number.duplicate_in_company",
                violation_error_message="A batch with this number already exists.",
            ),
        ),
    ]
