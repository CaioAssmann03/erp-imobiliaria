from django.db import migrations, models

# Spec 042: the apportionment models say whose they are. The tables are renamed in place; the
# foreign keys (`UnitFraction.criterion`, `BillingPlanItem.apportionment_criterion`) follow, and the
# constraints keep their database names but report the error codes of the new names.


class Migration(migrations.Migration):

    dependencies = [
        ('condominiums', '0012_condominium_billing_rules_in_billing'),
    ]

    operations = [
        migrations.RenameModel(old_name='ApportionmentCriterion', new_name='CondominiumApportionmentCriterion'),
        migrations.RenameModel(old_name='UnitFraction', new_name='UnitApportionmentFraction'),
        migrations.AlterConstraint(
            model_name='condominiumapportionmentcriterion',
            name='apportionment_criterion_unique_name',
            constraint=models.UniqueConstraint(fields=('condominium', 'name'), name='apportionment_criterion_unique_name', violation_error_code='condominium_apportionment_criterion.name.duplicate', violation_error_message='This condominium already has a criterion with this name.'),
        ),
        migrations.AlterConstraint(
            model_name='condominiumapportionmentcriterion',
            name='apportionment_criterion_unique_position',
            constraint=models.UniqueConstraint(fields=('condominium', 'position'), name='apportionment_criterion_unique_position', violation_error_code='condominium_apportionment_criterion.position.duplicate', violation_error_message='This condominium already has a criterion at this position.'),
        ),
        migrations.AlterConstraint(
            model_name='condominiumapportionmentcriterion',
            name='apportionment_criterion_position_from_1',
            constraint=models.CheckConstraint(condition=models.Q(('position__gte', 1)), name='apportionment_criterion_position_from_1', violation_error_code='condominium_apportionment_criterion.position.out_of_range', violation_error_message='The position must be 1 or more.'),
        ),
        migrations.AlterConstraint(
            model_name='unitapportionmentfraction',
            name='unit_fraction_unique_criterion',
            constraint=models.UniqueConstraint(fields=('unit', 'criterion'), name='unit_fraction_unique_criterion', violation_error_code='unit_apportionment_fraction.criterion.duplicate', violation_error_message='The unit already has a fraction for this criterion.'),
        ),
    ]
