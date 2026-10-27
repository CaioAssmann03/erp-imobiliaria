import django.db.models.deletion
from django.db import migrations, models

# Spec 043, step 2 of 5: the condominium points at `core.Address`, which is the same table, so only
# the model state changes.


class Migration(migrations.Migration):

    dependencies = [
        ('condominiums', '0013_literal_apportionment_names'),
        ('core', '0003_address'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='condominium',
                    name='address',
                    field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.address'),
                ),
                migrations.DeleteModel(name='Address'),
            ],
        ),
    ]
