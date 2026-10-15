import django.contrib.postgres.fields
from django.db import migrations, models

import apps.persons.models.person

# Hand-written: a plain AddField with the sequence default would number the existing people in
# physical row order; the ID must follow the order they were created in.
FILL_CODES_BY_CREATION_ORDER = """
    UPDATE persons_person AS person
    SET code = ranked.position
    FROM (
        SELECT id, row_number() OVER (ORDER BY created_at, id) AS position
        FROM persons_person
    ) AS ranked
    WHERE person.id = ranked.id AND person.code IS NULL
"""

# The next number is the one after the highest (1 on an empty table).
MOVE_SEQUENCE_PAST_HIGHEST_CODE = """
    SELECT setval('person_code_seq', COALESCE((SELECT MAX(code) FROM persons_person), 0) + 1, false)
"""


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_seed_company'),
        ('persons', '0004_constraint_error_codes'),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE SEQUENCE person_code_seq",
            reverse_sql="DROP SEQUENCE person_code_seq",
        ),
        migrations.AddField(
            model_name='person',
            name='code',
            field=models.BigIntegerField(editable=False, null=True),
        ),
        migrations.RunSQL(
            sql=[FILL_CODES_BY_CREATION_ORDER, MOVE_SEQUENCE_PAST_HIGHEST_CODE],
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='person',
            name='code',
            field=models.BigIntegerField(db_default=models.Func(models.Value('person_code_seq'), function='nextval'), editable=False, unique=True),
        ),
        migrations.AddField(
            model_name='person',
            name='modules',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(choices=[('condominiums', 'Condominiums'), ('rentals', 'Rentals')], max_length=20), blank=True, db_default=['condominiums'], default=apps.persons.models.person.default_modules),
        ),
        migrations.AddConstraint(
            model_name='person',
            constraint=models.CheckConstraint(condition=models.Q(('modules__len__gt', 0)), name='person_modules_not_empty', violation_error_code='person.modules.empty', violation_error_message='A person must belong to at least one module.'),
        ),
        migrations.AddConstraint(
            model_name='person',
            constraint=models.CheckConstraint(condition=models.Q(('modules__contained_by', ['condominiums', 'rentals'])), name='person_modules_known', violation_error_code='person.modules.unknown', violation_error_message='The person has an unknown module.'),
        ),
    ]
