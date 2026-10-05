---
summary: Worked example of a finished spec: filter persons by kind.
read-when: you want to see how a filled spec looks
skip-if: you need the blank template → features/_template.md; you need the persons API → apps/persons.md
---
# 001 — Filter persons by kind

**Status:** done · **Apps:** persons · **Frontend impact:** client regeneration

> Retro-spec of a finished feature, kept as a **worked example** of the template.

## Open questions
(none)

## R — Requirements
The persons list screen filters by "Física"/"Jurídica". The old API had a `tipo_pessoa` column; the new model stores the kind as the presence of a related
record, so the filter must be derived.
- [x] `GET /api/persons/?type=individual` returns only persons with a `PeopleIndividual`
- [x] `?type=legal` returns only persons with a `PeopleLegal`
- [x] any other value → 400; no `type` → all persons

## E — Entities
No schema change. Uses reverse one-to-one accessors `people_individual` and `people_legal`.

## A — Approach
A django-filter `FilterSet` with a `ChoiceFilter(method=...)` filtering on `isnull=False` of the reverse relation. Chosen over a stored `kind` column to avoid
duplicated state that could disagree with the related records.

## S — Structure
| File | Change |
|---|---|
| `apps/persons/filters.py` | new `PersonFilter` (`type`, `active`) |
| `apps/persons/views/person_views.py` | `filterset_class = PersonFilter` (replaces `filterset_fields`) |
| `apps/persons/tests/test_api_read.py` | tests |

| Method | URL | Query | Response |
|---|---|---|---|
| GET | `/api/persons/` | `type=individual\|legal`, `active=true\|false`, `query=` | paginated persons |

## O — Operations
1. Add `PersonFilter`. 2. Point the view at it. 3. Tests. 4. Regenerate the frontend client; use `type` in the persons list filter.

## N — Norms
`practices.md` §4 (derived filters live in `filters.py`); English values for query params (`api-conventions.md`).

## S — Safeguards
Read-only; no new personal data; `select_related` already covers both relations; invalid values rejected by the `ChoiceFilter` (400).

## Test plan
- API: `type=individual` and `type=legal` return the right persons (a person with no document appears in neither); invalid `type` → 400.

## Docs updated
`docs/apps/persons.md` (filters section).
