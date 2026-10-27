from django.db import migrations

# Hand-written (spec 046): one membership row per person who had `rentals` in the old `modules`
# array. Safe to run again; the array column stays in the database until a later release drops it.
# Going back is done once, by the reverse of `persons.0006_stop_using_modules`, which sees every module.
COPY_ARRAY_TO_MEMBERS = """
    INSERT INTO rentals_rentalpersonmember (id, created_at, updated_at, person_id)
    SELECT gen_random_uuid(), now(), now(), id
    FROM persons_person
    WHERE 'rentals' = ANY(modules)
    ON CONFLICT (person_id) DO NOTHING
"""


class Migration(migrations.Migration):

    dependencies = [
        ('rentals', '0001_person_member'),
    ]

    operations = [
        migrations.RunSQL(sql=COPY_ARRAY_TO_MEMBERS, reverse_sql=migrations.RunSQL.noop),
    ]
