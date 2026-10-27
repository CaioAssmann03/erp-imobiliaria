import django.db.models.deletion
from django.db import migrations, models


def fill_company_from_condominium(apps, schema_editor):
    """Each account is moved to its condominium's company; two accounts of one company cannot be merged by guessing."""
    GatewayAccount = apps.get_model("billing", "GatewayAccount")
    seen = {}
    for account in GatewayAccount.objects.select_related("condominium").order_by("created_at"):
        company_id = account.condominium.company_id
        if company_id in seen:
            raise RuntimeError(
                "Two gateway accounts belong to the same company; keep one and delete the other before migrating (spec 037)."
            )
        seen[company_id] = account.pk
        account.company_id = company_id
        account.save(update_fields=["company"])


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0010_billing_document_delivery"),
        ("core", "0002_seed_company"),
    ]

    operations = [
        migrations.AddField(
            model_name="gatewayaccount",
            name="company",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="gateway_account",
                to="core.company",
            ),
        ),
        migrations.RunPython(fill_company_from_condominium, migrations.RunPython.noop),
    ]
