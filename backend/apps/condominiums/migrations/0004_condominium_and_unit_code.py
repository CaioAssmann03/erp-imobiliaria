from django.db import migrations, models


# Hand-written: a plain AddField with the sequence default would number the existing rows in
# physical order; the ID must follow the order they were created in.
def number_by_creation_order(table: str, sequence: str) -> list[str]:
    return [
        f"""
        UPDATE {table} AS target
        SET code = ranked.position
        FROM (
            SELECT id, row_number() OVER (ORDER BY created_at, id) AS position
            FROM {table}
        ) AS ranked
        WHERE target.id = ranked.id AND target.code IS NULL
        """,
        # The next number is the one after the highest (1 on an empty table).
        f"SELECT setval('{sequence}', COALESCE((SELECT MAX(code) FROM {table}), 0) + 1, false)",
    ]


def sequence_default(sequence: str) -> models.Func:
    return models.Func(models.Value(sequence), function='nextval')


class Migration(migrations.Migration):

    dependencies = [
        ('condominiums', '0003_constraint_error_codes'),
    ]

    operations = [
        migrations.RunSQL(
            sql=["CREATE SEQUENCE condominium_code_seq", "CREATE SEQUENCE unit_code_seq"],
            reverse_sql=["DROP SEQUENCE unit_code_seq", "DROP SEQUENCE condominium_code_seq"],
        ),
        migrations.AddField(
            model_name='condominium',
            name='code',
            field=models.BigIntegerField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='unit',
            name='code',
            field=models.BigIntegerField(editable=False, null=True),
        ),
        migrations.RunSQL(
            sql=[
                *number_by_creation_order('condominiums_condominium', 'condominium_code_seq'),
                *number_by_creation_order('condominiums_unit', 'unit_code_seq'),
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='condominium',
            name='code',
            field=models.BigIntegerField(db_default=sequence_default('condominium_code_seq'), editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='unit',
            name='code',
            field=models.BigIntegerField(db_default=sequence_default('unit_code_seq'), editable=False, unique=True),
        ),
    ]
