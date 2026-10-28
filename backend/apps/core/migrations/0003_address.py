import uuid

from django.db import migrations, models

# Spec 043, step 1 of 5: `Address` moves from `condominiums` to `core` without copying anything. The
# model is created in the state on the table it already has; `condominiums.0014` repoints the
# condominium to it and forgets the old model; `0004` to `0006` give it a company and its final table name.


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_seed_company'),
        ('condominiums', '0013_literal_apportionment_names'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Address',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('zip_code', models.CharField(blank=True, max_length=8, null=True)),
                        ('street', models.CharField(blank=True, max_length=255, null=True)),
                        ('number', models.CharField(blank=True, max_length=10, null=True)),
                        ('complement', models.CharField(blank=True, max_length=60, null=True)),
                        ('district', models.CharField(blank=True, max_length=120, null=True)),
                        ('city', models.CharField(blank=True, max_length=120, null=True)),
                        ('state', models.CharField(blank=True, max_length=2, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'verbose_name': 'Address',
                        'verbose_name_plural': 'Addresses',
                        'db_table': 'condominiums_address',
                    },
                ),
            ],
        ),
    ]
