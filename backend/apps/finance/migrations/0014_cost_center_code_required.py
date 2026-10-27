from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("finance", "0013_cost_center_code")]

    operations = [
        migrations.AlterField(
            model_name="costcenter",
            name="code",
            field=models.PositiveSmallIntegerField(blank=True),
        ),
        migrations.AddConstraint(
            model_name="costcenter",
            constraint=models.UniqueConstraint(
                fields=("condominium", "code"),
                name="cost_center_unique_code_per_condominium",
                violation_error_code="cost_center.code.duplicate_in_condominium",
                violation_error_message="This condominium already has a cost center with this code.",
            ),
        ),
    ]
