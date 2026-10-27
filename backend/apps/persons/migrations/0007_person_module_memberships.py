import apps.persons.validators
import django.db.models.deletion
import uuid
from django.db import migrations, models


# Hand-written around the generated model (spec 048): the two one-to-one member tables of spec 046 are
# copied into the single table, and the app migrations that follow drop them. Safe to run again.
MEMBER_TABLES = (
    ("condominiums", "condominiums", "CondominiumPersonMember"),
    ("rentals", "rentals", "RentalPersonMember"),
)


def copy_member_tables_into_memberships(apps, schema_editor):
    membership_model = apps.get_model("persons", "PersonModuleMembership")
    for module, app_label, model_name in MEMBER_TABLES:
        member_model = apps.get_model(app_label, model_name)
        membership_model.objects.bulk_create(
            [
                membership_model(person_id=person_id, module=module)
                for person_id in member_model.objects.values_list("person_id", flat=True)
            ],
            ignore_conflicts=True,
        )


def copy_memberships_back_into_member_tables(apps, schema_editor):
    """Going back: the member tables (recreated by the reverse of the drops) get their rows again.
    Only the two modules of spec 046 have a table to go back to."""
    membership_model = apps.get_model("persons", "PersonModuleMembership")
    for module, app_label, model_name in MEMBER_TABLES:
        member_model = apps.get_model(app_label, model_name)
        member_model.objects.bulk_create(
            [
                member_model(person_id=person_id)
                for person_id in membership_model.objects.filter(module=module).values_list(
                    "person_id", flat=True
                )
            ],
            ignore_conflicts=True,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0006_stop_using_modules'),
        ('condominiums', '0009_backfill_person_members'),
        ('rentals', '0002_backfill_person_members'),
    ]

    operations = [
        migrations.CreateModel(
            name='PersonModuleMembership',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('module', models.CharField(max_length=30, validators=[apps.persons.validators.validate_registered_module])),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_memberships', to='persons.person')),
            ],
            options={
                'verbose_name': 'Person module membership',
                'verbose_name_plural': 'Person module memberships',
                'ordering': ('module',),
                'constraints': [models.UniqueConstraint(fields=('person', 'module'), name='person_module_membership_unique', violation_error_code='person_module_membership.person.already_released', violation_error_message='The person is already released to this module.')],
            },
        ),
        migrations.RunPython(copy_member_tables_into_memberships, copy_memberships_back_into_member_tables),
    ]
