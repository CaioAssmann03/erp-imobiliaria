---
summary: Plan and status of part 04 of phase 3a — Validated and smaller seed_demo.
read-when: you work on validated and smaller seed_demo before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 04 — Validated and smaller seed_demo

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** core · **Frontend impact:** none · **Depends on:** 02
**Spec:** none (refactor, no behavior change)

## Goal
`seed_demo` can never create an invalid state, and its two long functions are split. Decided in gaps #21 and #24.

## Scope
- [x] Call `full_clean()` before every `save()`/`create` in `seed_demo`
- [x] Add a test that runs the seed and checks it creates no invalid state (sum caps, unique names)
- [x] Split `_create` and `_create_unit_links` below ~20 lines (`conventions/naming.md` §11)
- [x] Delete gap #24; reword gap #21 to the accepted race risk only

## Draft for the spec
Seed material from the known-gaps review of 2026-10-05. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Every writer outside the serializers calls `full_clean()` (`conventions/practices.md`).
- The race between two simultaneous writes on the sum caps stays an accepted risk (revisit with bulk import or a writing portal).

### Open questions
- [ ] None: decided in gaps #21 and #24.

## Result
Done on 2026-10-05. `seed_demo` creates every record through `_create_validated` (build, `full_clean()`, `save()`) and changes existing ones through `_save_validated`; the only writes left outside the rules are the `created_at` backdating queryset updates (an `auto_now_add` field cannot be set otherwise; commented in the code).
Splits: `_create_unit_links` → `_create_owner_link` + `_create_tenant_link`; `Command._create` → `_create_demo_condominiums` + `_report`.
The validation immediately found invalid demo data: e-mails built from names with accents (`João`, `Patrícia`) or a trailing dot; fixed with `_email_slug` (ASCII, dot-separated, at most 24 characters).
Tests added: `test_seed_creates_only_records_the_model_rules_accept` (every seeded model, `full_clean()` on each record) and `test_seed_helper_rejects_a_record_that_breaks_a_rule`. Checked: `mypy apps config` clean, `pytest apps -q` 208 passed. Cost: the seed tests are slower (about 3 s per seed run) because every record is validated.
