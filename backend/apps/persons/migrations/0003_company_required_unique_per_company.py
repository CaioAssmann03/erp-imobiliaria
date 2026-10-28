import apps.core.infrastructure.validators.cnpj
import apps.core.infrastructure.validators.cpf
import django.db.models.deletion
from django.db import migrations, models


def required_company(related_name: str) -> models.ForeignKey:
    return models.ForeignKey(
        on_delete=django.db.models.deletion.PROTECT,
        related_name=related_name,
        to="core.company",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("persons", "0002_company"),
    ]

    operations = [
        migrations.AlterField(model_name="person", name="company", field=required_company("people")),
        migrations.AlterField(model_name="peopleindividual", name="company", field=required_company("individuals")),
        migrations.AlterField(model_name="peoplelegal", name="company", field=required_company("legals")),
        migrations.AlterField(
            model_name="peopleindividual",
            name="cpf",
            field=models.CharField(max_length=11, validators=[apps.core.infrastructure.validators.cpf.validate_cpf]),
        ),
        migrations.AlterField(
            model_name="peopleindividual",
            name="rg",
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="peoplelegal",
            name="cnpj",
            field=models.CharField(max_length=14, validators=[apps.core.infrastructure.validators.cnpj.validate_cnpj]),
        ),
        migrations.AddConstraint(
            model_name="peopleindividual",
            constraint=models.UniqueConstraint(
                fields=("company", "cpf"),
                name="people_individual_unique_cpf_per_company",
                violation_error_message="A person with this CPF already exists in this company",
            ),
        ),
        migrations.AddConstraint(
            model_name="peopleindividual",
            constraint=models.UniqueConstraint(
                condition=models.Q(("rg__isnull", False)),
                fields=("company", "rg"),
                name="people_individual_unique_rg_per_company",
                violation_error_message="A person with this RG already exists in this company",
            ),
        ),
        migrations.AddConstraint(
            model_name="peoplelegal",
            constraint=models.UniqueConstraint(
                fields=("company", "cnpj"),
                name="people_legal_unique_cnpj_per_company",
                violation_error_message="A person with this CNPJ already exists in this company",
            ),
        ),
    ]
