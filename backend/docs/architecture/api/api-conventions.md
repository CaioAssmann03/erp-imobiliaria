---
summary: API contract rules: routes, auth, pagination, search, filters, writes, errors, OpenAPI/frontend contract.
read-when: you add or change an endpoint, filter, pagination or error shape
skip-if: serializer/view code patterns → practices.md; security and permissions → architecture/quality/security.md
---
# API conventions

- Base path `/api/`. Resources are **plural, English, kebab-case** (`condominiums`, `unit-people`); router basenames are singular
  kebab-case (`unit-person`) and give URL names `unit-person-list` / `unit-person-detail`.
- Auth: `POST /api/auth/login/` (username/password) and `/api/auth/refresh/` (SimpleJWT). Every other endpoint requires
  `Authorization: Bearer <access>` (default `IsAuthenticated`). Authorization beyond "logged in" is not implemented yet (admins only).
- Ids are UUIDs; money/decimals are serialized as **strings**; dates ISO 8601.

## Collections
- **Pagination** (`core.pagination.StandardPagination`): `?page=` and `?limit=` (default 20, max 100); body `{count, next, previous, results}`.
  Querysets must be **ordered** (`Meta.ordering`), otherwise pages are unstable.
- **Search**: `?query=` (`core.filters.QuerySearchFilter`, based on DRF `SearchFilter`); fields come from the view's `search_fields`;
  terms are space-separated and must all match. `?search=` still works (legacy).
- **Filters**: django-filter `filterset_fields` (exact matches such as `?active=true`, `?condominium=<uuid>`); a custom `FilterSet`
  in `filters.py` for derived filters (example: `persons` `?type=individual|legal`).
- Avoid N+1: `select_related` / `prefetch_related` in the viewset queryset for everything the serializer reads.

## Writes
- `ModelViewSet` (create, update, partial update, delete). The frontend uses PATCH for edits.
- **Nested one-to-one parts** (address, contract, billing rules, people_individual/people_legal) are written through the parent serializer
  (`create`/`update` in `transaction.atomic`). **Child collections** (unit people) have their own endpoint.
- **Business rules live only in the models** (validators, `clean()`, constraints). Serializers inherit `ModelRulesMixin`, which runs the model's `full_clean()` so any broken rule
  yields **400** with the model's message on the model's field, never 500. Serializers contain no domain logic (see `practices.md` §2–3).

## Errors
- 400: DRF dict `{field: [messages]}`, nested for nested serializers (`{"administration_contract": {"fee_amount": [...]}}`);
  rule-level errors under `non_field_errors`. 401 invalid/missing token; 403 forbidden; 404 missing record.
- Messages are **English** (the frontend maps known ones to Portuguese). Do not return Portuguese user text from the API.
- The messages come from the model (`clean()`/validators/`violation_error_message`); keep a rule's message identical across `clean()` and its constraint.

## Contract with the frontend
- drf-spectacular generates the schema from serializers/views; the frontend client is generated from it (orval). Field names, enums and
  `read_only` flags in serializers **are** the contract.
- After any API change, tell the user to regenerate the frontend client. Breaking a field name or enum value is a breaking change:
  needs a feature spec and a note to the user.
- Use `read_only_fields` for ids and timestamps; expose related objects as read-only nested serializers (`person_detail`, `unit_people`).
- Dashboard and search are non-model endpoints (`APIView` + plain `Serializer`s for documentation) living in `core`.
