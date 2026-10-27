import django.db.models.deletion
from django.db import migrations, models

# Spec 043, step 5 of 5: the company becomes required, the table gets its final name and the content
# type moves to `core`, so the audit history of the addresses stays attached.


def move_content_type_to_core(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    if not ContentType.objects.filter(app_label="core", model="address").exists():
        ContentType.objects.filter(app_label="condominiums", model="address").update(app_label="core")


def move_content_type_back(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    if not ContentType.objects.filter(app_label="condominiums", model="address").exists():
        ContentType.objects.filter(app_label="core", model="address").update(app_label="condominiums")


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_address_backfill_company'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='address',
            name='company',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='addresses', to='core.company'),
        ),
        migrations.AlterModelTable(name='address', table='address'),
        migrations.RunPython(move_content_type_to_core, move_content_type_back),
    ]
