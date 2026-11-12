---
summary: Spec 060 — the cost center list can be filtered by catalog item and each cost center carries its condominium's name, so the catalog can show which condominiums use a sub-conta.
read-when: you change the cost center list filters or fields, or the Catálogo de sub-contas screen's "Condomínios" section
skip-if: the catalog itself (code, name, delete rules) → features/053-cost-center-catalog.md; the cost center rules → apps/finance.md
---
# 060 — Condominiums of a catalog item

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** finance · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | The Catálogo de sub-contas shows, in the open item, the condominiums that use it, not only how many | user |
| 2026-10-30 | No new endpoint: `GET /api/cost-centers/?catalog_item=<id>` lists the sub-contas made from the item (active or not: it is still an association) and each row carries a read-only `condominium_name` | agent, to be confirmed |

## R — Requirements
- [x] R1 — `GET /api/cost-centers/?catalog_item=<id>` returns only the cost centers of that catalog item
- [x] R2 — every cost center in the API has a read-only `condominium_name`

## E — Entities
`No schema change.`

## S — Structure
- `apps/finance/views/cost_center_views.py` — `catalog_item` joins the filter fields
- `apps/finance/serializers/cost_center_serializers.py` — `condominium_name` (`source="condominium.name"`, read only; the viewset already selects the condominium)

## Test plan
| Criterion | Test |
|---|---|
| R1, R2 | `apps/finance/tests/test_cost_centers.py::test_the_condominiums_that_use_a_catalog_item_are_listed_by_name` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/apps/finance.md` updated; roadmap part/phase and the spec index updated (if applicable)
