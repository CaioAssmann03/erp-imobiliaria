from django.db import migrations, models


def number_the_cost_centers(apps, schema_editor):
    """Each condominium's cost centers get 0, 1, 2... in the order they were created (0 is the Conta Normal)."""
    CostCenter = apps.get_model("finance", "CostCenter")
    counters: dict[object, int] = {}
    for cost_center in CostCenter.objects.order_by("condominium_id", "created_at", "name"):
        number = counters.get(cost_center.condominium_id, 0)
        counters[cost_center.condominium_id] = number + 1
        cost_center.code = number
        cost_center.save(update_fields=["code"])


class Migration(migrations.Migration):
    dependencies = [("finance", "0012_automatic_billing_entries")]

    operations = [
        migrations.AddField(
            model_name="costcenter",
            name="code",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(number_the_cost_centers, migrations.RunPython.noop),
    ]
