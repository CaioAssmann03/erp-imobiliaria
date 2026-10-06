import django.db.models.deletion
from django.db import migrations, models
from django.db.models import OuterRef, Subquery


def assign_company(apps, schema_editor):
    """Existing people join the only company; refuse to guess when there are several."""
    Person = apps.get_model("persons", "Person")
    PeopleIndividual = apps.get_model("persons", "PeopleIndividual")
    PeopleLegal = apps.get_model("persons", "PeopleLegal")
    Company = apps.get_model("core", "Company")
    people = Person.objects.filter(company__isnull=True)
    if people.exists():
        companies = list(Company.objects.all()[:2])
        if len(companies) != 1:
            raise RuntimeError(
                "People exist but there is not exactly one company: assign Person.company by hand "
                "before migrating (spec 004)."
            )
        people.update(company=companies[0])
    person_company = Subquery(
        Person.objects.filter(pk=OuterRef("person_id")).values("company_id")
    )
    PeopleIndividual.objects.filter(company__isnull=True).update(company=person_company)
    PeopleLegal.objects.filter(company__isnull=True).update(company=person_company)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_seed_company"),
        ("persons", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="person",
            name="company",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="people",
                to="core.company",
            ),
        ),
        migrations.AddField(
            model_name="peopleindividual",
            name="company",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="individuals",
                to="core.company",
            ),
        ),
        migrations.AddField(
            model_name="peoplelegal",
            name="company",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="legals",
                to="core.company",
            ),
        ),
        migrations.RunPython(assign_company, migrations.RunPython.noop),
    ]
