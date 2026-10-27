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
| 3a | [Prerequisites for phase 3](phase-3a-prerequisites/README.md) | done | 9/9 | Known-gaps review |
| 3 | [Finance base](phase-3-finance-base/README.md) | done | 7/7 | Sprint 3 |
| 4 | [Billing issuance (generation)](phase-4-billing-generation/README.md) | done | 7/7 | Sprint 4 |
| 5 | [Billing issuance (gateway)](phase-5-billing-bank-integration/README.md) | in-progress | 0/7 | Sprint 5 |
| 6 | [Closings and agreements](phase-6-closings-and-agreements/README.md) | todo | 0/4 | Sprint 6 |
| 7 | [Client portal](phase-7-client-portal/README.md) | todo | 0/3 | Sprint 7 |
| 8 | [Rentals](phase-8-rentals/README.md) | todo | 0/5 | Sprint 8 |

Current position: phases 1, 2, **3a** (closed on 2026-10-19: hosting docs, `render.yaml` retired, VPS compose versioned in `deploy/vps/` with a health check, spec 008 closed), **3** (finance base, Sprint 3) and **4** (billing issuance, Sprint 4: Asaas sandbox account, billing plans, documents, monthly issuance, draft boleto PDF and the three screens groups, specs 024–029; closed on 2026-10-21) are **done**. **Next:** phase 5 (Asaas) is **implemented but not closed**: all seven parts are coded and tested (specs 030–036: gateway account (reworked by spec 037 into **one Asaas account for the company**, no sub-accounts), charge registration, the payment webhook and ledger posting, the daily reconciliation, the manual reissue, the e-mail delivery and the screens), and stay `in-progress` until they are validated against the Asaas sandbox (the existing **CPF** sandbox account is enough now, plus a tunnel to the webhook endpoints, and for the e-mail a verified Resend domain and keys). Then phase 6. Also pending: a manual browser run of the Cobrança screens.

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
| ContratoAdministracao (condominium) | `CondominiumAdministrationContract` |

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
