import apps.accounts.models.user_manager
import django.db.models.deletion
from django.db import migrations, models


def assign_company(apps, schema_editor):
    """Existing users join the only company; refuse to guess when there are several."""
    User = apps.get_model("accounts", "User")
    Company = apps.get_model("core", "Company")
    users = User.objects.filter(company__isnull=True)
    if not users.exists():
        return
    companies = list(Company.objects.all()[:2])
    if len(companies) != 1:
        raise RuntimeError(
            "Users exist but there is not exactly one company: assign User.company by hand "
            "before migrating (spec 004)."
        )
    users.update(company=companies[0])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("core", "0002_seed_company"),
    ]

    operations = [
        migrations.AlterModelManagers(
            name="user",
            managers=[
                ("objects", apps.accounts.models.user_manager.UserManager()),
            ],
        ),
        migrations.AddField(
            model_name="user",
            name="company",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="users",
                to="core.company",
            ),
        ),
        migrations.RunPython(assign_company, migrations.RunPython.noop),
    ]
