---
summary: Plan and status of part 02 of phase 3a — Rename the stub apps to English.
read-when: you work on rename the stub apps to english before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 02 — Rename the stub apps to English

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** financeiro, cobranca, locacoes, vendas · **Frontend impact:** none · **Depends on:** 01
**Spec:** none (refactor, no behavior change)

## Goal
`financeiro→finance`, `cobranca→billing`, `locacoes→rentals`, `vendas→sales`, before the first new model of phase 3 lands. Decided in gap #7.

## Scope
- [x] Rename the four app folders, `AppConfig.name`, `INSTALLED_APPS`, imports and `config/urls.py`
- [x] Reset the migrations of the renamed apps to one `0001` each (decision 11); recreating the staging database moved to part 01 (it depends on the new hosting)
- [x] Update `docs/apps/finance.md`, `AGENTS.md` maps, `architecture/overview.md` layers diagram and the roadmap text that still said the old names
- [x] Search the frontend, `docker-compose.yml`, CI and `.env.example` for the old names (none: the API paths and field names did not change)
- [x] `pytest`, `makemigrations --check` and `check_docs.py` green

## Draft for the spec
Seed material from the known-gaps review of 2026-10-05. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Only the app labels change: API paths and field names stay the same, so the frontend client is not regenerated.
- The three stubs are only renamed here; they are restructured into packages when their phase starts.

### Open questions
- [ ] None: decided in gap #7 (rename the four now; recreate the staging database).

## Result
Done on 2026-10-05. `apps/financeiro`, `cobranca`, `locacoes`, `vendas` are now `apps/finance`, `billing`, `rentals`, `sales` (`git mv`; `AppConfig` classes `FinanceConfig`, `BillingConfig`, `RentalsConfig`, `SalesConfig`, names `apps.<english>`); `INSTALLED_APPS`, the imports in `core` (tests, `seed_demo`) and `finance.models.entry_template` follow.
`finance` had three migrations; they were replaced by a single regenerated `0001_initial` (the three stubs have no models, so no migration). The "coast center" typo in the `EntryTemplate` message was fixed on the way.
Checked: `manage.py check` clean, `makemigrations --check --dry-run` "No changes detected", `pytest apps -q` 197 passed. No frontend change (API paths and field names are unchanged).
**Needs a manual step:** a database that applied the old history must be recreated. Local development: `docker compose down -v && docker compose up -d`, then `migrate` and `createsuperuser` (or `seed_demo`). The staging database is recreated in part 01.
