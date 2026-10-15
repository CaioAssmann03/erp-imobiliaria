from django.db import migrations, models

# Hand-written: a plain AddField with the sequence default would number the existing condominiums
# in physical row order; the ID must follow the order they were created in.
FILL_CODES_BY_CREATION_ORDER = """
    UPDATE condominiums_condominium AS condominium
    SET code = ranked.position
    FROM (
        SELECT id, row_number() OVER (ORDER BY created_at, id) AS position
        FROM condominiums_condominium
    ) AS ranked
    WHERE condominium.id = ranked.id AND condominium.code IS NULL
"""

# The next number is the one after the highest (1 on an empty table).
MOVE_SEQUENCE_PAST_HIGHEST_CODE = """
    SELECT setval('condominium_code_seq', COALESCE((SELECT MAX(code) FROM condominiums_condominium), 0) + 1, false)
"""


class Migration(migrations.Migration):

    dependencies = [
        ('condominiums', '0003_constraint_error_codes'),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE SEQUENCE condominium_code_seq",
            reverse_sql="DROP SEQUENCE condominium_code_seq",
        ),
        migrations.AddField(
            model_name='condominium',
            name='code',
            field=models.BigIntegerField(editable=False, null=True),
        ),
        migrations.RunSQL(
            sql=[FILL_CODES_BY_CREATION_ORDER, MOVE_SEQUENCE_PAST_HIGHEST_CODE],
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='condominium',
            name='code',
            field=models.BigIntegerField(db_default=models.Func(models.Value('condominium_code_seq'), function='nextval'), editable=False, unique=True),
        ),
    ]
