from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):
    """Habilita o pg_trgm, base dos índices de busca por trecho de texto."""

    dependencies = [
        ("core", "0002_seed_empresa_eve"),
    ]

    operations = [TrigramExtension()]
