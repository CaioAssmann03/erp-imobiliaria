from django.db import migrations, models

# Spec 044: the contract a condominium has with the administrator says whose it is. The table is
# renamed in place; the check constraints keep their database names but report the error codes of
# the new name.


class Migration(migrations.Migration):

    dependencies = [
        ('condominiums', '0014_address_in_core'),
    ]

    operations = [
        migrations.RenameModel(old_name='AdministrationContract', new_name='CondominiumAdministrationContract'),
        migrations.AlterConstraint(
            model_name='condominiumadministrationcontract',
            name='contract_fixed_needs_amount',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('fee_type', 'fixed'), _negated=True), ('fee_amount__isnull', False), _connector='OR'), name='contract_fixed_needs_amount', violation_error_code='condominium_administration_contract.fee_amount.required_for_fixed', violation_error_message='Fixed fee requires an amount.'),
        ),
        migrations.AlterConstraint(
            model_name='condominiumadministrationcontract',
            name='contract_variable_needs_pct_basis',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('fee_type', 'variable'), _negated=True), models.Q(('fee_percentage__isnull', False), ('fee_basis__isnull', False)), _connector='OR'), name='contract_variable_needs_pct_basis', violation_error_code='condominium_administration_contract.variable_fee.requires_percentage_and_basis', violation_error_message='Variable fee requires percentage and basis.'),
        ),
        migrations.AlterConstraint(
            model_name='condominiumadministrationcontract',
            name='contract_floor_lte_ceiling',
            constraint=models.CheckConstraint(condition=models.Q(('fee_floor__isnull', True), ('fee_ceiling__isnull', True), ('fee_floor__lte', models.F('fee_ceiling')), _connector='OR'), name='contract_floor_lte_ceiling', violation_error_code='condominium_administration_contract.fee_floor.exceeds_ceiling', violation_error_message='Floor cannot exceed ceiling.'),
        ),
    ]
