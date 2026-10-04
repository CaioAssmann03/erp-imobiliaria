---
summary: Recipes: add field, model, endpoint, filter, data migration, Celery task, external integration, permissions.
read-when: you do a recurring change on the system
skip-if: pattern details → practices.md; creating a new app → architecture/structure/app-anatomy.md
---
# Extending the system — recipes

Always: feature spec first (`docs/features/`), ask on gaps, then follow the steps and `practices.md`.

## Add a field to an existing model
1. Model: field with explicit `null`/`blank`/default; constraint if it is a rule (tuple in `Meta.constraints`, with `violation_error_message`).
2. Serializer: add to `Meta.fields`; add the rule to `validate` (mirror the constraint, same message).
3. `makemigrations`; for existing rows give a default or a data migration. Never edit applied migrations.
4. Admin (`list_display`/inline) if useful; tests (constraint + serializer + API payload).
5. Update `docs/apps/<app>.md`; tell the user the frontend client must be regenerated.

## Add a model (entity)
1. `models/<entity>.py` (UUID id, timestamps, `@final`, Meta, `__str__`); export in `models/__init__.py`.
2. Decide `on_delete` with `data-model.md` policy; add `related_name`; type hints for reverse managers under `TYPE_CHECKING`.
3. `serializers/<entity>_serializers.py` (+ `validate` mirroring constraints), `views/<entity>_views.py`, register in `urls.py`, admin.
4. Migration, tests, docs. If the entity is a 1:1 part of a parent, write it via the parent's serializer (see `practices.md`, nested).

## Add an endpoint to an existing resource
Non-CRUD actions: `@action` on the ViewSet (documented with `@extend_schema`). Read-only aggregates: `APIView` with a documentation serializer
in `serializers/` (see `core` dashboard/search). Permissions: default `IsAuthenticated`; add a permission class only when a spec requires roles.

## Add a filter or search field
`filterset_fields` for exact matches; `filters.py` FilterSet for derived ones (`persons` `type`); `search_fields` on the ViewSet
(they query with `icontains`; add a trigram index if the table is large and the field is searched often).

## Data migration / seed
- One-off data (like the initial company): `RunPython` migration with a reverse function, idempotent (`get_or_create`).
- Demo data: management command `seed_demo` (deterministic, idempotent, `--clear` removes only what it created). Extend it when you add
  entities that make the demo richer.

## Celery task
`tasks.py` inside the app (autodiscovered by `config/celery.py`); `@shared_task`; idempotent, accept ids (not model instances), log, retry
with backoff for external calls. Schedules go to Celery beat settings. Document the task in `docs/apps/<app>.md`. (No task exists yet.)

## External integration (e.g. Santander boleto/Pix)
Isolate it in `apps/<app>/services/<provider>.py` (client + typed request/response), keep credentials in env vars, never in code; call it from
Celery tasks or service functions, not from serializers; store provider ids and statuses in models; write tests with the HTTP layer mocked.

## Permissions (when roles appear)
Create `core/permissions.py` (or per app), set `permission_classes` on viewsets, scope querysets by company/user, and test 403 and queryset isolation.
This needs a feature spec (it changes the contract for every endpoint).
