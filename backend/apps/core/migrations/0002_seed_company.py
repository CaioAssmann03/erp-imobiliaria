from django.db import migrations

CNPJ = "03136483000144"


def create_company(apps, schema_editor):
    Company = apps.get_model("core", "Company")
    Company.objects.get_or_create(
        cnpj=CNPJ,
        defaults={
            "legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA",
            "trade_name": "EVE Administradora",
            "active": True,
        },
    )


def remove_company(apps, schema_editor):
    Company = apps.get_model("core", "Company")
    Company.objects.filter(cnpj=CNPJ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_company, remove_company),
    ]
