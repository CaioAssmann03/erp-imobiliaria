import django.db.models.deletion
from django.db import migrations, models

# Hand-written (spec 039): a share item names its criterion by foreign key instead of by number.
# The number is mapped to the criterion of that position in the plan's condominium; the old column
# only leaves the model state, so the previous release keeps working during the deploy (a later
# release drops it). The two check constraints on the old column are dropped for real: they would
# refuse the new items, which have no number.

LAST_NUMBER = 6


def map_numbers_to_criteria(apps, schema_editor):
    """Safe to run again; a number nobody used yet gets its criterion here."""
    Item = apps.get_model("billing", "BillingPlanItem")
    Criterion = apps.get_model("condominiums", "ApportionmentCriterion")
    for item in Item.objects.filter(ideal_fraction_number__isnull=False).select_related("plan"):
        name = "Geral" if item.ideal_fraction_number == 1 else f"Fração {item.ideal_fraction_number}"
        criterion, _ = Criterion.objects.get_or_create(
            condominium_id=item.plan.condominium_id,
            position=item.ideal_fraction_number,
            defaults={"name": name},
        )
        item.apportionment_criterion = criterion
        item.save(update_fields=["apportionment_criterion"])


def map_criteria_to_numbers(apps, schema_editor):
    """Going back: the number is the position of the item's criterion; a position beyond the sixth
    has no valid number, so the migration refuses instead of changing what the item shares by."""
    Item = apps.get_model("billing", "BillingPlanItem")
    items = Item.objects.filter(apportionment_criterion__isnull=False).select_related("apportionment_criterion")
    if items.filter(apportionment_criterion__position__gt=LAST_NUMBER).exists():
        raise RuntimeError("Cannot go back: a plan item shares by a criterion beyond the sixth position.")
    for item in items:
        item.ideal_fraction_number = item.apportionment_criterion.position
        item.save(update_fields=["ideal_fraction_number"])


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0010_billing_document_delivery'),
        ('condominiums', '0010_apportionment_criteria'),
    ]

    operations = [
        migrations.AddField(
            model_name='billingplanitem',
            name='apportionment_criterion',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.RESTRICT, related_name='billing_plan_items', to='condominiums.apportionmentcriterion'),
        ),
        migrations.RunPython(map_numbers_to_criteria, migrations.RunPython.noop),
        migrations.RemoveConstraint(
            model_name='billingplanitem',
            name='billing_plan_item_ideal_fraction_number_1_6',
        ),
        migrations.RemoveConstraint(
            model_name='billingplanitem',
            name='billing_plan_item_fraction_matches_kind',
        ),
        migrations.RunPython(migrations.RunPython.noop, map_criteria_to_numbers),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(
                    model_name='billingplanitem',
                    name='ideal_fraction_number',
                ),
            ],
        ),
    ]
