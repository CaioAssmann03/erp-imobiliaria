import django.db.models.deletion
from django.db import migrations, models

# Spec 043, step 3 of 5: an address now has its own company (the scope can no longer come from one
# owner). The column is added empty here; `0005` fills it and `0006` makes it required. Three
# migrations because a table with pending constraint events cannot be altered in the transaction
# that updated it.


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_address'),
        ('condominiums', '0014_address_in_core'),
    ]

    operations = [
        migrations.AddField(
            model_name='address',
            name='company',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='addresses', to='core.company'),
        ),
    ]
