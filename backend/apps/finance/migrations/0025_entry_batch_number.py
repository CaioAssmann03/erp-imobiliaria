import apps.finance.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    """Spec 073, step 1 of 3: a number for every entry batch, empty until step 2 fills the existing ones."""

    dependencies = [("finance", "0024_case_insensitive_unique_text")]

    operations = [
        migrations.AddField(
            model_name="entrybatch",
            name="number",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                validators=[apps.finance.validators.validate_positive_batch_number],
            ),
        ),
    ]
