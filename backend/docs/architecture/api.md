---
summary: API contract rules: routes, auth, pagination, search, filters, writes, errors and the OpenAPI/frontend contract.
read-when: you add or change an endpoint, filter, pagination or error shape
skip-if: serializer/view code patterns → conventions/practices.md; permissions, secrets, personal data → architecture/quality.md
---
# API conventions

- Base path `/api/`. Resources are **plural, English, kebab-case** (`condominiums`, `unit-people`); router basenames are singular (`unit-person`) and give `unit-person-list` / `unit-person-detail`.
- Auth: `POST /api/auth/login/` and `/api/auth/refresh/` (SimpleJWT); everything else needs `Authorization: Bearer <access>`.
- **Company scoping:** a user sees and writes only their company's records (a superuser sees all). A record of another company answers **404**; a related id of another company answers **400 "does not exist"** (the same as a missing id). `company` is read-only; what you create belongs to your company. Every viewset uses `CompanyScopedViewSetMixin` and every model declares `company_lookup` (`apps/core/scoping.py`).
- Ids are UUIDs; decimals are serialized as **strings** (money: `"1250.00"`); dates ISO 8601.
- State changes that are not a plain edit are `POST` actions on the record (`/accounts-payable/{id}/settle/`, `.../cancel/`): the transition and its rules are a model method, the view only parses the input and calls it.

## Collections
- **Pagination** (`core.pagination.StandardPagination`): `?page=`, `?limit=` (default 20, max 100); body `{count, next, previous, results}`. Querysets must be **ordered** (`Meta.ordering`).
- **Search**: `?query=` (`core.filters.QuerySearchFilter`) over the view's `search_fields`; space-separated terms must all match. `?search=` still works (legacy).
- **Filters**: `filterset_fields` for exact matches (`?active=true`, `?condominium=<uuid>`); a `FilterSet` in `filters.py` for derived ones (`persons` `?type=individual|legal`).
- Avoid N+1: `select_related` / `prefetch_related` for everything the serializer reads.

## Writes
- `ModelViewSet`; the frontend edits with PATCH.
- 1:1 parts (address, contract, billing rules, `people_individual`/`people_legal`) are written through the parent serializer; child collections (unit people) have their own endpoint.
- A nested object is validated as a **complete record**: a PATCH that touches a nested part sends the whole nested object (the rules read its other fields). The spec of any new nested part repeats this.
- Rules live only in the models; serializers inherit `ModelRulesMixin` (runs `full_clean()`), so a broken rule is **400**, never 500 (`conventions/practices.md` §2–3).

## Errors
Every error response (400, 401, 403, 404, 405, 429...) has one body, built by `apps/core/exception_handler.py` (spec 006); the HTTP status is DRF's and does not change. A real 500 is left to Django (nothing internal leaves the server).
```json
{"errors": [
  {"field": "administration_contract.fee_amount", "code": "administration_contract.fee_amount.required_for_fixed", "message": "Fixed fee requires an amount."},
  {"field": null, "code": "not_authenticated", "message": "Authentication credentials were not provided."}
]}
```
- `field` is the dotted path (`address.city`, `unit_people.0.person`, list positions as numbers) and **null** when the error is not about a field (`non_field_errors`, `detail`).
- `code` is the **stable contract**: the frontend translates by code (`frontend/lib/error-messages.ts`); `message` is the English fallback. Generic Django/DRF/SimpleJWT codes (`required`, `blank`, `null`, `invalid`, `max_length`, `unique`, `does_not_exist`, `not_authenticated`, `permission_denied`, `not_found`, `throttled`, `token_not_valid`...) stay as they are; domain codes are dotted `model.field.reason` (shared validators `<validator>.<reason>`) and live in each app's `error_codes.py`. Adding a code is compatible; renaming or removing one is breaking (it needs a spec).
- The OpenAPI schema carries `ErrorCodeEnum` (every registered code), `ErrorItem` and `ErrorResponse`, attached to the operations (`apps/core/schema.py`), so the generated client types the code as a union and an untranslated code fails to compile.
- Messages are **English** and come from the model (`clean()`/validators/`violation_error_message`, identical in `clean()` and its constraint, together with the same code).

## Contract with the frontend
- drf-spectacular builds the schema from serializers/views; orval generates the client. Field names, enums and `read_only` flags **are** the contract.
- After any API change, tell the user to regenerate the client (`cd frontend && npm run generate:api`). Renaming a field or enum value is breaking: it needs a spec.
- `read_only_fields` for ids and timestamps; related objects as read-only nested serializers (`person_detail`, `unit_people`).
- Dashboard and search are non-model endpoints (`APIView` + plain `Serializer`s for documentation) in `core`.
