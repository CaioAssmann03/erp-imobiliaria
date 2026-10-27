from django.db import migrations

# Hand-written (spec 046): the model stops using `modules` (and its two check constraints) but the
# column stays in the database, so a container of the previous release that is still running during
# the deploy keeps inserting people (the column has a database default). A later release drops it.

# Going back rebuilds the array from every module's memberships. The old rule needs at least one
# module, so a person with none goes back to the old default, `condominiums`.
REBUILD_MODULES_FROM_MEMBERS = """
    UPDATE persons_person AS person
    SET modules = COALESCE(
        NULLIF(
            ARRAY(
                SELECT module FROM (
                    SELECT 'condominiums' AS module
                    WHERE EXISTS (
                        SELECT 1 FROM condominiums_condominiumpersonmember WHERE person_id = person.id
                    )
                    UNION ALL
                    SELECT 'rentals'
                    WHERE EXISTS (
                        SELECT 1 FROM rentals_rentalpersonmember WHERE person_id = person.id
                    )
                ) AS memberships
            ),
            '{}'::text[]
        ),
        ARRAY['condominiums']
    )
"""


class Migration(migrations.Migration):

    dependencies = [
        ('persons', '0005_person_code_and_modules'),
        ('condominiums', '0009_backfill_person_members'),
        ('rentals', '0002_backfill_person_members'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(sql=migrations.RunSQL.noop, reverse_sql=REBUILD_MODULES_FROM_MEMBERS),
            ],
            state_operations=[
                migrations.RemoveConstraint(model_name='person', name='person_modules_not_empty'),
                migrations.RemoveConstraint(model_name='person', name='person_modules_known'),
                migrations.RemoveField(model_name='person', name='modules'),
            ],
        ),
    ]
