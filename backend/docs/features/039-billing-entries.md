---
summary: Spec 039 — "Inclusão de valores": the screen and API to launch the values that go on the boletos (event, rateio, recurrence, subconta, per-unit amounts), plus the events catalog.
read-when: you build or change the launches (lançamentos) that feed the monthly boleto, the events catalog, or the Inclusão de valores screen
skip-if: the fixed monthly plan → apps/billing.md (BillingPlan); how a document is issued → features/history.md (spec 026); the registration fee → features/038-registration-fee.md; the gateway account → features/037-single-gateway-account.md
---
# 039 — Billing entries (Inclusão de valores)

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** billing, finance, frontend · **Frontend impact:** new screens

Reference: the "Inclusão de valores", "Novo lançamento" and "Evento" screens of the system the administradora uses today (five screenshots sent by the user on 2026-10-26).

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-26 | The launches **complement** the billing plans: the plan stays the monthly base and the launches of the month are added to it in the same boleto | the user |
| 2026-10-26 | Rateio: **Individual** = the same value on each selected unit; **Coletivo** = one total split equally among the selected units; **Fração** = one total split by the ideal fraction of each selected unit | the user |
| 2026-10-26 | An **event** is a catalog entry (code + name) **independent of any subconta**; it exists to fill the description quickly (code 250 = "Limpeza do condomínio"). It is not an entry template | the user |
| 2026-10-26 | Recurrence: **Não repetir** (one month), **Parcelado** (n months, shown "k/n"), **Sempre** (every month until stopped) | the user (screenshots) |
| 2026-10-26 | A launch picks a **subconta** (default: the condominium's *Conta Normal*, code 0000); the boleto's money is one; the credit goes to that subconta of the condominium (spec 037) | the user |
| 2026-10-26 | Two settings lists are needed: **events** and **subcontas** | the user |
| 2026-10-26 | All the open questions of the first draft were answered "recommended" by the user: a settings tab **Eventos e subcontas**; the entry template is chosen automatically (the subconta's only active template; the launch is refused when it has none or several); the event prints as "event name - description" (the name alone without a description); **Normal boleto only** (Extra gets its own spec); **no negative values**; **"Definir por %", "Arredondar" and "Lançar em lote" left out** until explained; a launch already used by an issued document cannot be edited or deleted (a recurrence is stopped with `end`); a month with launches but no plan is issued; the registration fee of spec 038 stays its own mechanism | the user |
| 2026-10-26 | **Subconta scope (deviation from the recommendation, to be confirmed):** the company-wide catalog with a code would rewrite the `CostCenter` ownership across 55 files of the finance and billing apps and merge existing data by name. This spec only adds a **`code`** to the per-condominium `CostCenter` (unique per condominium, `0` is the *Conta Normal*, the launch form's default). The company-wide catalog becomes its own spec | agent, to be confirmed |
| 2026-10-26 | A **fraction** launch splits the total over the *selected* units in proportion to their ideal fraction (normalised by the sum of the selected fractions), so the parts always add up to the total; a **collective** launch splits equally, the leftover cents going to the first units by name | agent, to be confirmed |
| 2026-10-26 | A `BillingDocumentItem` keeps a nullable `billing_entry` link: it is how a launch knows it was used (frozen) and how a recurrence knows the months already issued | agent, to be confirmed |

## R — Requirements
The administradora launches, per condominium and reference month, the values that appear on the boletos besides the fixed plan, and sees them by unit before issuing.
- [ ] R1 — An **event** has a code (unique per company, number) and a name; CRUD in the settings; deleting one that launches use is refused
- [ ] R2 — A **launch** has: condominium, reference month, event (optional), description (optional), rateio, recurrence (and the number of installments), subconta, value, and the selected units
- [ ] R3 — The value per unit follows the rateio: individual (value per unit), collective (total split equally, leftover cents deterministic and the parts add up to the total), fraction (total split by the ideal fraction, rounded half-up to the cent, leftover to the unit with the largest fraction, exactly like a plan item)
- [ ] R4 — A launch applies to the months its recurrence covers: once → its month; installments → n consecutive months from its month; always → from its month until it is ended
- [ ] R5 — The monthly issuance adds the launches in force to each unit's boleto after the plan items, each as a document item with the launch's subconta, an automatically chosen entry template and its description (event name and description); a unit selected for a launch gets its line, others do not
- [ ] R6 — A **preview** answers the per-unit values of a launch not yet saved (the "Valores" panel of the form)
- [ ] R7 — The grid of the screen shows, for a condominium and month, one row per unit and one column per launch (header: event, total, installment "k/n"), a total per unit and a grand total
- [ ] R8 — A launch of a month that already has issued documents cannot be edited or deleted (pending the question)
- [ ] R9 — The screen is company-scoped and permissions are the same as the billing plans

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `BillingEvent` (*Evento*) | new, `@final`, billing | `company`, `code` (positive integer, unique per company), `name`, `active` |
| `BillingEntry` (*Lançamento*) | new, `@final`, billing | `condominium`, `event` (null), `description` (blank), `allocation` `individual/collective/fraction`, `ideal_fraction_number` (fraction only), `recurrence` `once/installments/always`, `installments_total` (installments only, ≥ 2), `start_month` (day 1), `end_month` (null; set to stop an "always"), `cost_center` (subconta of the condominium), `amount` positive |
| `BillingEntryUnit` | new, `@final`, billing | `entry`, `unit` (of the same condominium), optional `amount` override (individual only), unique (`entry`, `unit`) |
| `CostCenter` | changed (pending the first question) | `code` |

Rules live in the models (`BillingEntryRules`): kind-specific fields as in `BillingPlanItemRules`, units of the entry's condominium, subconta of the entry's condominium and active.

## A — Approach
- The launch is a **model**, not a plan item: a plan is a fixed list per condominium, a launch has its own months, units and rateio. Both produce `NewBillingDocumentItem`s, so `create_billing_document` and everything after it (gateway, webhook, ledger) stay unchanged.
- The share arithmetic of `BillingPlanItem.amounts_by_unit` moves to one shared function used by the plan item and the launch.
- `issue_condominium_billing` asks `BillingEntry.objects.in_force(condominium, reference_month)` next to the plans and appends the lines.
- Rejected: one row per month per launch (a recurrence would need a task to create future rows); reusing `EntryTemplate` as the event (the user's events are not tied to a subconta).

## S — Structure
To be written when the open questions are answered. Expected: `billing-events` and `billing-entries` resources (CRUD, `?condominium=&reference_month=`), `POST /billing-entries/preview/`, `POST /billing-entries/{id}/end/` for "always"; frontend `app/(dashboard)/billing/entries` (grid, drawer form, units step) and a settings tab for events and subcontas.

## O — Operations
To be written with the structure.

## N — Norms
`conventions/practices.md` §2–§3b; frontend: `operations/new-resource-page.md` and `norms/forms.md`.

## S — Safeguards
- Money: the sum of the unit amounts of a collective or fraction launch equals its total to the cent; a launch never produces a zero or negative line.
- A launch cannot reach a condominium other than its own (units and subconta are checked against it).
- The issuance stays idempotent: the same month issued twice adds nothing.

## Test plan
To be filled when the spec is `ready`; each criterion gets a test.

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`); `pnpm exec tsc --noEmit`, `eslint` and `pnpm build` clean
- [ ] `docs/apps/billing.md` and the frontend docs updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated (if **Roadmap** is set); index in `features/README.md` updated
