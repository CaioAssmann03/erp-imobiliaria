---
summary: Plan and status of part 03 of phase 3a — Clean mypy and enforce it in CI.
read-when: you work on clean mypy and enforce it in ci before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 03 — Clean mypy and enforce it in CI

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** all · **Frontend impact:** none · **Depends on:** 02
**Spec:** none (refactor, no behavior change)

## Goal
Fix the 33 mypy errors (12 files, measured 2026-10-05) and make `mypy apps config` a blocking CI step. Decided in gap #4.

## Scope
- [x] Fix the errors in app code (dashboard annotation, untyped unfold admin classes, `core/filters.py` annotations)
- [x] Fix the errors in tests (`save()` used as a value, UUID query params, duplicate `TestUnitModelRules`)
- [x] Add `mypy apps config` to the backend job of `.github/workflows/ci.yml`
- [x] Update `architecture/quality.md`; delete gap #4 from `known-gaps.md`

## Draft for the spec
Seed material from the known-gaps review of 2026-10-05. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Run it after the rename (part 02) so no file is fixed twice.

### Open questions
- [ ] None: decided in gap #4 (fix all, then block in CI).

## Result
Done on 2026-10-05: `mypy apps config` reports "no issues in 134 source files"; it is a blocking step of the backend CI job (before the tests). `pytest apps -q`: 206 passed.
Changes: `mypy.ini` relaxes `disallow_subclassing_any` only for `apps.*.admin` and `apps.persons.filters` (unfold and django-filter have no types); `types-python-dateutil` added to `requirements-dev.txt`; annotations in `core/filters.py`, `seed_demo`, `dashboard_views` (the dashboard no longer filters on an annotated name: `DashboardContext` now carries `units_with_responsible` and `units_without_responsible`, built with one `Exists` expression, same counts); `Unit.clean()` narrows `block` before reading it; tests passed `str(pk)` as query params.
**Found on the way:** `apps/condominiums/tests/test_unit.py` had two classes named `TestUnitModelRules`; the second hid the first, so five model-rule tests never ran. The second is now `TestUnitDatabaseRules` and all of them run (26 in the file), which is why the suite went from 197 to 206 tests.
