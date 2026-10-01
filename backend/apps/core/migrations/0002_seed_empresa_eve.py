from django.db import migrations


def criar_empresa_eve(apps, schema_editor):
    Empresa = apps.get_model("core", "Empresa")
    Empresa.objects.get_or_create(
        cnpj="03.136.483/0001-44",
        defaults={
            "razao_social": "EVE ADM DE IMOVEIS COND E VENDAS LTDA",
            "nome_fantasia": "EVE Administradora",
            "ativo": True,
        },
    )


def remover_empresa_eve(apps, schema_editor):
    Empresa = apps.get_model("core", "Empresa")
    Empresa.objects.filter(cnpj="03.136.483/0001-44").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(criar_empresa_eve, remover_empresa_eve),
    ]
