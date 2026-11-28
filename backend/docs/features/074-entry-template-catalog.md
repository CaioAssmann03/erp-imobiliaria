---
summary: Spec 074 (draft) — one catalog of entry templates for the whole administradora, each with a unique number and valid for every condominium, replacing the templates that belong to a sub-conta of a condominium; what it changes in the ledger, payables, plans, boletos and billing launches.
read-when: you change what an entry template is, how it is numbered or chosen, or you touch billing launches, plan items, boleto items or payables that carry a template
skip-if: the manual entry screen that uses it → features/073-manual-entries-workspace.md; the sub-conta catalog it follows → features/053-cost-center-catalog.md; the ledger → apps/finance.md
---
# 074 — Entry template catalog

**Status:** draft · **Level:** full · **Roadmap:** none · **Apps:** finance, billing, frontend · **Frontend impact:** client regeneration, changed screens

The user chose this on 2026-11-26 while answering the questions of spec 073. It is bigger than it looks, so it is a spec of its own and comes **after** 073, which does not wait for it.

## Open questions
None. The six questions were answered on 2026-11-28 (the rows of *Decisions* below); the sections after the requirements are completed before the implementation starts.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-26 | The entry templates become **one catalog of the administradora**, each with a **unique number**, valid for **all** the condominiums (like the sub-contas catalog of spec 053) | the user |
| 2026-11-28 | The spec is **approved** ("APROVADO") with the recommended answers to its six open questions, which are the next six rows; it stays `draft` until its structure, operations and test plan are written, and it is implemented after 073 and 075 | the user |
| 2026-11-28 | **Billing launches** (*Inclusão de valores*) get an explicit **Modelo** field, chosen from the catalog and required; the automatic "only active template of the sub-conta" (`BillingEntry.clean`) and the rule that refuses a sub-conta with none or several go away | the user (recommended answer, approved) |
| 2026-11-28 | **Plan items, boleto items and accounts payable** choose the template from the **whole catalog**, not filtered by sub-conta; the three rules "the template belongs to the item's sub-conta" go away, and a payable no longer fills its template from its sub-conta | the user (recommended answer, approved) |
| 2026-11-28 | Templates with the **same name in different sub-contas** become one catalog item; when their attributes (accumulation history, accumulates to the balance, social security, administration fee percentage) differ, those of the template that has **the most entries** win, the oldest on a tie | the user (recommended answer, approved) |
| 2026-11-28 | The catalog templates are **maintained in the Django Admin**, as today; a *Financeiro → Modelos de lançamento* screen like the sub-conta catalog is a later spec | the user (recommended answer, approved) |
| 2026-11-28 | The first template number is **1**, as the billing events | the user (recommended answer, approved) |
| 2026-11-28 | **Staging:** spec 073 comes first, with the template chosen **by name** in the new entry screen; the typed template number arrives with this spec | the user (recommended answer, approved) |

## R — Requirements
The questions are answered; the rest of the spec (structure, operations, norms, test plan, the migration's reverse) is written before the implementation starts. What is already clear:
- [ ] R1 — A template has a number (from 1), unique in the company, and a name, unique in the company (case-insensitive); it carries the attributes it has today (accumulation history, accumulates to the balance, social security, administration fee percentage) and `active`
- [ ] R2 — A template no longer belongs to a sub-conta: any template of the company can be used with any sub-conta of any condominium of the company
- [ ] R3 — The templates that exist are merged by name into the catalog and every record that points to a template (ledger entries, accounts payable, plan items, boleto items, billing launches) points to the merged one; the migration reverses
- [ ] R4 — Billing launches ask for an explicit, required **Modelo**; plan items, boleto items and accounts payable take any template of the catalog, with no filter by sub-conta (the answers above)
- [ ] R5 — Every screen that picks a template shows `number - name` and accepts the number typed; the entry screen of spec 073 starts using the typed number
- [ ] R6 — The `entry-templates` API is company-wide: no `condominium` or `cost_center` filter, `?query=` matches the name and the number

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `finance.EntryTemplate` | `company`, `code`; no `cost_center` | unique `(company, code)` and `(company, Lower(name))`; `company_lookup = "company"` |
| `finance.CurrentAccountEntry` | rule | the template belongs to the account's company (it checked the condominium through the sub-conta) |
| `finance.AccountPayable`, `billing.BillingPlanItem`, `billing.BillingDocumentItem`, `billing.BillingEntry` | rules | the "template belongs to the cost center" rules are replaced by "template of the same company"; `BillingEntry` loses the automatic template and gets the field the answer asks for |
| `finance.CostCenter` | rule | `CostCenterArchiveRules.has_entry_templates` goes (no template hangs from a sub-conta) |

## A — Approach
Follows spec 053 (the sub-conta catalog): a data migration groups the existing templates **by name** per company, the first number free from 1 goes to each, the attributes follow the answer above, and every foreign key is repointed in the same migration; three migrations (schema, data, constraint) because Postgres refuses to mix a data update with the `NOT NULL` change. The rules stay in the models. Rejected: keeping a template row per sub-conta and a catalog on top (the screen would still need a row for every template × sub-conta pair, and billing's "only active template of the sub-conta" would break as soon as a second one was used there).

## S — Structure
Not final. The code that mentions a template today (from a search of the repository on 2026-11-26): about 50 backend files outside the migrations and tests (`finance`: models, rules, errors, serializers, views, filters, admin, audit, urls, the accountability report; `billing`: the plan item, document item and launch models, rules and serializers, `create_billing_document`, `issue_condominium_billing`, `issue_extra_billing_document`, `post_billing_document_payment`; `seed/finance.py`), about 30 test files, 9 migrations and 12 frontend files. The files are listed once the questions are answered.

## O — Operations
To be written with the answers. The order is: backend (catalog, data migration, rules, API, tests), then the frontend and the client regeneration, then the entry screen's typed number.

## N — Norms
N/A until written.

## S — Safeguards
The migration touches ledger entries, accounts payable and billing records: it runs on a copy of the data first and is reversible; the balances do not change (a test compares `recalculated_balance()` before and after).

## Test plan
To be written with the answers.

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean; `mypy apps config` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`)
- [ ] `docs/apps/finance.md` and `docs/apps/billing.md` updated; `known-gaps.md` row closed (if any)
- [ ] The migration ran on a copy of real-shaped data
