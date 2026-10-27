from django.db import migrations

# Spec 043, step 4 of 5: each address takes the company of the condominium that points at it; one no
# condominium points at is unreachable (no endpoint, no relation) and has no company to take, so it
# is removed.


def give_each_address_its_company(apps, schema_editor):
    Address = apps.get_model("core", "Address")
    Condominium = apps.get_model("condominiums", "Condominium")
    for condominium in Condominium.objects.exclude(address__isnull=True).only("address_id", "company_id"):
        Address.objects.filter(pk=condominium.address_id).update(company_id=condominium.company_id)
    Address.objects.filter(company__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_address_company'),
    ]

    operations = [
        migrations.RunPython(give_each_address_its_company, migrations.RunPython.noop),
    ]
