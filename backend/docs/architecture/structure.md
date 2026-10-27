---
summary: Layout of an app, the re-export rule, steps to create an app, and recipes for recurring changes (field, model, endpoint, filter, migration).
read-when: you create or restructure an app, or do a recurring change on the system
skip-if: code patterns and rule placement → conventions/practices.md; naming → conventions/naming.md; API shapes → architecture/api.md
---
# App structure and recipes

Always: feature spec first (`features/`), ask on gaps, then follow `conventions/practices.md`.

## Anatomy
```
apps/<app>/
  apps.py            @final AppConfig, name = "apps.<app>"
  admin.py           unfold ModelAdmin / TabularInline
  models/            package, one entity per file; __init__.py re-exports (X as X)
  models/querysets/  one <Entity>QuerySet per file (only for entities that have one)
  models/rules/      one <Entity>Rules per file, only for a model whose clean() has 2+ rules; clean() just calls it
  serializers/       <entity>_serializers.py; re-exports
  services/          one file per use case (a function named like the file), only where a use case orchestrates several models or a transaction; __init__.py stays empty
  views/             <entity>_views.py (ViewSets); re-exports
  errors/            one <Entity>Error enum (code + English message) per entity, errors/validators.py for shared validators; __init__.py re-exports
  filters.py         only for custom FilterSets
  urls.py            DefaultRouter, included by config/urls.py
  migrations/        generated; never edited once applied
  tests/             base.py, conftest.py, test_*.py
```
An app omits what it does not need (`accounts` has only auth views). Other code imports from the package (`from apps.condominiums.models import Unit`); inside the app import the concrete module to avoid cycles.

## New app
1. `python manage.py startapp <app> apps/<app>`; delete the generated `models.py`, `views.py`, `tests.py`.
2. `apps.py` as above; add `"apps.<app>"` to `INSTALLED_APPS` after its dependencies.
3. Create `models/`, then `serializers/`, `views/`, `urls.py`, `admin.py`, `tests/`; include the urls in `config/urls.py`.
4. `makemigrations <app>`; write `docs/apps/<app>.md` when the app starts (add it to `docs/README.md` and the `AGENTS.md` map). Stub apps (`billing`, `rentals`, `sales`) are restructured by their first feature.

## Recipes
**Field:** explicit `null`/`blank`/default; the rule goes in the model (validator for one field, `clean()` for several) plus a constraint with the same message; the serializer only gets the field in `Meta.fields`; `makemigrations` (a default or data migration for existing rows); tests; update `docs/apps/<app>.md`; client regeneration.

**Model:** `models/<entity>.py` (a base from `core/models/base.py`, `@final`, Meta, `__str__`) exported in `__init__.py`; `on_delete` per `architecture/data.md`; `related_name`; `errors/<entity>.py` for its rules; serializer (`ModelRulesMixin` + `ModelSerializer`), view, `urls.py`, admin; migration, tests, docs. A 1:1 part is written through its parent's serializer.

**Endpoint:** non-CRUD actions via `@action` with `@extend_schema`; read-only aggregates via `APIView` + a documentation serializer (see the `core` dashboard).

**Filter/search:** `filterset_fields` for exact, `filters.py` for derived, `search_fields` (`icontains`; add a trigram index when the table is large).

**Data migration/seed:** one-off data = an idempotent `RunPython` with a reverse; demo data = `seed_demo`, in the `seed` app (deterministic, idempotent, `--clear` removes only what it created).

Celery tasks, external integrations (the bank API) and roles have no recipe yet: write it with the first one, in a spec.
