---
summary: Roadmap of the project — phases (one per sprint), their parts and status, plus the backlog.
read-when: you need to know what is done, what comes next, or you plan a new phase or part
skip-if: you are specifying one feature → features/README.md; you need business rules → architecture/data.md
---
# Roadmap

Source: the *Sprints*, *Data model* and *Stack* documents of the project (Google Drive folder "ERP IMOBILIARIA"; sprints dated 2026-09-29).
Each **sprint** is a **phase**; each phase is a folder with a `README.md` and one file per **part** (`NN-slug.md`).
A part is the plan; the **feature spec** in `features/` is the contract used to implement it.

## Status values
Phase: `todo` → `in-progress` → `done`. Part: `todo` → `in-progress` → `done` (or `blocked`; or `moved` = carried over to a later part, which owns it).
A phase is `done` only when every part is `done` or `moved`.

## Phases
| # | Phase | Status | Parts done | Source |
|---|---|---|---|---|
| 1 | [Foundations](phase-1-foundations/README.md) | done | 5/5 | Sprint 1 |
| 2 | [Condominium registry](phase-2-condominium-registry/README.md) | done | 4/4 | Sprint 2 |
| 3a | [Prerequisites for phase 3](phase-3a-prerequisites/README.md) | in-progress | 7/9 | Known-gaps review |
| 3 | [Finance base](phase-3-finance-base/README.md) | in-progress | 6/7 | Sprint 3 |
| 4 | [Billing issuance (generation)](phase-4-billing-generation/README.md) | todo | 0/6 | Sprint 4 |
| 5 | [Billing issuance (bank)](phase-5-billing-bank-integration/README.md) | todo | 0/5 | Sprint 5 |
| 6 | [Closings and agreements](phase-6-closings-and-agreements/README.md) | todo | 0/4 | Sprint 6 |
| 7 | [Client portal](phase-7-client-portal/README.md) | todo | 0/3 | Sprint 7 |
| 8 | [Rentals](phase-8-rentals/README.md) | todo | 0/5 | Sprint 8 |

Current position: phases 1 and 2 are done. **Phase 3a** (prerequisites from the known-gaps review) is done except two items that wait for the backend hosting decision: part 01 (deploy docs) and the host checklist of part 09. **Phase 3** is in progress: parts 01 to 05 and 07 are done (backend and screens); only part 06 (payment receipts) remains, **blocked** until the hosting and the bucket are decided.

## How to use
1. Pick the next `todo` part in the lowest unfinished phase (respect **Depends on**).
2. Answer the part's **Open questions** with the user, then write the feature spec (`features/README.md`, full or lite) and link it in the part; the spec owns the detail from then on.
3. Implement, tick the **Scope** checklist, fill **Result**, set the part `done`, update the phase table and this index. `python backend/docs/tools/check_docs.py` verifies the statuses agree.
4. New phase or part: copy [`_template-phase.md`](_template-phase.md) or [`_template-part.md`](_template-part.md) and rewrite its header.

## Cross-phase decisions still open
| Decision | Recommended | Affects |
|---|---|---|
| Polymorphic holder/origin (`titular`, `origem`, cost-center type): nullable FKs + `CheckConstraint` of exactly one, or `GenericForeignKey` | nullable FKs + constraint (integrity in the database) | phases 3, 4, 6, 8 |
| Rename stub apps to English (`financeiro`→`finance`, `cobranca`→`billing`, `locacoes`→`rentals`, `vendas`→`sales`) | **Done** (phase 3a part 02): `finance`, `billing`, `rentals`, `sales` | phases 3, 4, 8 |
| Tenancy: extend `UnitPerson` or use the new `Property`/`RentalContract` | new entities (as in the data model PDF) | phase 8 |
| Allocation of a payment that differs from the sum of items | priority order, fee first | phase 5 part 04 |
| Permissions model before customer data is exposed | company scoping (`User` → `Company`) in a spec before phase 3; roles + scoping via `UnitPerson` in phase 7 | phases 3, 7 |
| Versions: PDFs say Django 5 / Next 15; the code uses Django 6 | record in `architecture/overview.md` | docs |

## Name map (PDF → code)
| PDF | Code |
|---|---|
| Empresa | `Company` |
| Pessoa | `Person` |
| UnidadeParte | `UnitPerson` |
| SubConta | `CostCenter` |
| Historico | `EntryTemplate` |
| ContratoAdministracao (condominium) | `AdministrationContract` |

Names of later entities are proposals in each part's **Entities** table.

## Backlog (no phase yet)
- Sales module (proposals, sale contracts, installments, commission) — no screens seen yet
- WhatsApp Business delivery — needs a verified Meta account and approved templates (lead time like the bank)
- Automatic DIMOB / Carnê-Leão / IRRF files
- Payroll of condominium employees (caretaker); FGTS, health plan and life insurance stay ordinary expenses via entry templates
- Data migration from the reference system (Sami) — registries are created from scratch
- Granular access profiles (today: username and password only)
- Post office print batches (`PrintBatch`) for physical boleto delivery
- Property inspections per room (`Inspection`, `InspectionRoom`)
