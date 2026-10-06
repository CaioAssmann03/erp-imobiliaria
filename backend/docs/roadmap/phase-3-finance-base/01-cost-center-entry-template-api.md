---
summary: Plan and status of part 01 of phase 3 — Finish cost center and entry template API.
read-when: you work on finish cost center and entry template api or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 01 — Finish cost center and entry template API

**Status:** done · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** client regeneration · **Depends on:** phase 3a
**Spec:** [009 — Cost center and entry template API](../../features/history.md) (section 009)

## Goal
Close the carry-over of phase 2 part 04.

## Scope
- [x] Serializers, viewsets, filters and URLs for `CostCenter` and `EntryTemplate`
- [x] Django Admin
- [x] Tests
- [x] Create `docs/apps/finance.md` sections for the API

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 009 `done`). `/api/cost-centers/` and `/api/entry-templates/` (CRUD, filters, search, stable order), company-scoped and audited; Django Admin for both (cost center with its templates inline); a cost center with entry templates answers 400 `cost_center.deletion.has_entry_templates` on delete (model rule + the handler now turns a Django `ValidationError` raised outside a serializer into the usual 400); `condominium` of a cost center and `cost_center` of a template are fixed after creation; `Meta.ordering` on both (migration `finance.0003`, no SQL); no frontend screen (API and Admin only).
Frontend: three Portuguese texts and the regenerated client; `tsc`, `eslint`, `build` clean. Checked: `pytest apps -q` 411 passed, `mypy apps config` clean.
This also closes the carry-over of phase 2 part 04.