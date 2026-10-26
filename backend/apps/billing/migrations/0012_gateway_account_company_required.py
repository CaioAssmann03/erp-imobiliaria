import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0011_gateway_account_company"),
    ]

    operations = [
        migrations.AlterField(
            model_name="gatewayaccount",
            name="company",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="gateway_account",
                to="core.company",
            ),
        ),
        migrations.RemoveField(model_name="gatewayaccount", name="condominium"),
        migrations.RemoveField(model_name="gatewayaccount", name="gateway_account_id"),
        migrations.RemoveField(model_name="gatewayaccount", name="wallet_id"),
        migrations.RemoveField(model_name="gatewayaccount", name="approved_at"),
        migrations.AlterModelOptions(
            name="gatewayaccount",
            options={
                "ordering": ("company__legal_name",),
                "verbose_name": "Gateway Account",
                "verbose_name_plural": "Gateway Accounts",
            },
        ),
    ]
