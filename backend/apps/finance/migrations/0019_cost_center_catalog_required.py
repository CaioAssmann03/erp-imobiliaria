import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Spec 053, step 3 of 3: every sub-conta has its catalog item, once per condominium."""

    dependencies = [("finance", "0018_backfill_cost_center_catalog")]

    operations = [
        migrations.AlterField(
            model_name="costcenter",
            name="catalog_item",
            field=models.ForeignKey(
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cost_centers",
                to="finance.costcentercatalogitem",
            ),
        ),
        migrations.AddConstraint(
            model_name="costcenter",
            constraint=models.UniqueConstraint(
                fields=("condominium", "catalog_item"),
                name="cost_center_unique_catalog_item_per_condominium",
                violation_error_code="cost_center.catalog_item.duplicate_in_condominium",
                violation_error_message="This condominium already uses this sub-conta of the catalog.",
            ),
        ),
    ]
