from django.db import migrations

# Spec 041: `BillingRules` and `LateInterestRate` moved to `billing`, which copied their rows (its
# migration 0012). The old tables stay, with their rows, for the previous release during the deploy
# (a later release drops them), so only the model state changes. Their foreign keys to the
# condominium are dropped: the models no longer know the tables, so a row left there would make
# deleting a condominium fail, and a table flush refuses to truncate the condominium table.

OLD_TABLES = ("condominiums_billingrules", "condominiums_lateinterestrate")
CONDOMINIUM_TABLE = "condominiums_condominium"


def drop_foreign_keys(apps, schema_editor):
    connection = schema_editor.connection
    for table in OLD_TABLES:
        with connection.cursor() as cursor:
            constraints = connection.introspection.get_constraints(cursor, table)
        for name, details in constraints.items():
            if details["foreign_key"]:
                schema_editor.execute(
                    f"ALTER TABLE {schema_editor.quote_name(table)} DROP CONSTRAINT {schema_editor.quote_name(name)}"
                )


def restore_foreign_keys(apps, schema_editor):
    """Going back: rows of a condominium deleted meanwhile are removed so the key can be added."""
    for table in OLD_TABLES:
        schema_editor.execute(
            f"DELETE FROM {schema_editor.quote_name(table)}"
            f" WHERE condominium_id NOT IN (SELECT id FROM {schema_editor.quote_name(CONDOMINIUM_TABLE)})"
        )
        schema_editor.execute(
            f"ALTER TABLE {schema_editor.quote_name(table)}"
            f" ADD CONSTRAINT {schema_editor.quote_name(table + '_condominium_id_restored_fk')}"
            f" FOREIGN KEY (condominium_id) REFERENCES {schema_editor.quote_name(CONDOMINIUM_TABLE)} (id)"
            " DEFERRABLE INITIALLY DEFERRED"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('condominiums', '0011_person_module_memberships'),
        ('billing', '0012_condominium_billing_rules_in_billing'),
    ]

    operations = [
        migrations.RunPython(drop_foreign_keys, restore_foreign_keys),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name='BillingRules'),
                migrations.DeleteModel(name='LateInterestRate'),
            ],
        ),
    ]
