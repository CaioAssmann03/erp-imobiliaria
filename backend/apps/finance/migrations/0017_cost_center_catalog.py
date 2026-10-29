import uuid

import django.db.models.deletion
import django.db.models.functions.text
from django.db import migrations, models


class Migration(migrations.Migration):
    """Spec 053, step 1 of 3: the catalog table and a nullable link on the sub-conta (0018 fills it, 0019 requires it)."""

    dependencies = [
        ("core", "0006_address_table"),
        ("finance", "0016_reversal_justification_constraint"),
    ]

    operations = [
        migrations.CreateModel(
            name="CostCenterCatalogItem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.PositiveSmallIntegerField(blank=True)),
                ("name", models.CharField(max_length=120)),
                ("active", models.BooleanField(default=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="cost_center_catalog_items",
                        to="core.company",
                    ),
                ),
            ],
            options={
                "verbose_name": "Cost Center Catalog Item",
                "verbose_name_plural": "Cost Center Catalog",
                "ordering": ("code",),
                "constraints": [
                    models.UniqueConstraint(
                        fields=("company", "code"),
                        name="cost_center_catalog_item_unique_code_per_company",
                        violation_error_code="cost_center_catalog_item.code.duplicate_in_company",
                        violation_error_message="The catalog already has a sub-conta with this code.",
                    ),
                    models.UniqueConstraint(
                        models.F("company"),
                        django.db.models.functions.text.Lower("name"),
                        name="cost_center_catalog_item_unique_name_per_company",
                        violation_error_code="cost_center_catalog_item.name.duplicate_in_company",
                        violation_error_message="The catalog already has a sub-conta with this name.",
                    ),
                ],
            },
        ),
        migrations.AddField(
            model_name="costcenter",
            name="catalog_item",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cost_centers",
                to="finance.costcentercatalogitem",
            ),
        ),
    ]
