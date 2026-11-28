from django.db import migrations

# Each company's batches get 1, 2, 3... in the order they happened (date, then creation), after the highest number
# it already has: a second run only numbers what is still empty.
NUMBER_THE_EMPTY_BATCHES_IN_ORDER = """
    UPDATE finance_entrybatch AS batch
    SET number = ranked.position + ranked.already_numbered
    FROM (
        SELECT unnumbered.id,
               row_number() OVER (
                   PARTITION BY unnumbered.company_id
                   ORDER BY unnumbered.batch_date, unnumbered.created_at, unnumbered.id
               ) AS position,
               (
                   SELECT COALESCE(MAX(numbered.number), 0)
                   FROM finance_entrybatch AS numbered
                   WHERE numbered.company_id = unnumbered.company_id
               ) AS already_numbered
        FROM finance_entrybatch AS unnumbered
        WHERE unnumbered.number IS NULL
    ) AS ranked
    WHERE batch.id = ranked.id
"""


class Migration(migrations.Migration):
    """Spec 073, step 2 of 3: number the batches that exist."""

    dependencies = [("finance", "0025_entry_batch_number")]

    operations = [
        migrations.RunSQL(
            sql=NUMBER_THE_EMPTY_BATCHES_IN_ORDER,
            reverse_sql="UPDATE finance_entrybatch SET number = NULL",
        ),
    ]
