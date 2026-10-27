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
| 2026-10-26 | All the open questions of the first draft were answered "recommended" by the user: a settings tab **Eventos e subcontas**; the entry template is chosen automatically (the subconta's only active template; the launch is refused when it has none or several); the event prints as `<code>-<name>` and then the description (see spec 038); **Normal boleto only** (Extra gets its own spec); **no negative values**; **"Definir por %" and "Arredondar" dropped, "Lançar em lote" not needed for now** (the user, 2026-10-27); a launch already used by an issued document cannot be edited or deleted (a recurrence is stopped with `end`); a month with launches but no plan is issued; the registration fee of spec 038 stays its own mechanism | the user |
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
- Backend: `apps/billing/models/billing_event.py`, `billing_entry.py`, `billing_entry_unit.py`, `models/rules/billing_entry.py`, `billing_entry_unit.py`, `models/querysets/billing_entry.py`; `errors/billing_event.py`, `billing_entry.py`; `serializers/billing_event_serializers.py`, `billing_entry_serializers.py`; `views/billing_event_views.py`, `billing_entry_views.py`; `services/create_billing_entry.py`, `update_billing_entry.py`, `replace_billing_entry_units.py`, `end_billing_entry.py`, `preview_billing_entry.py`; `services/issue_condominium_billing.py` and `create_billing_document.py` (the line carries its entry); `BillingDocumentItem.billing_entry`; migration `billing.0013`; `apps/finance`: `CostCenter.code` (migrations `0013`–`0014`).
- Endpoints (all company-scoped): `billing-events` CRUD; `billing-entries` CRUD (nested `units`), `POST /billing-entries/preview/?reference_month=`, `POST /billing-entries/{id}/end/`.
- Frontend: `app/(dashboard)/billing/entries/` (grid and `NewEntrySheet`), `billing/events/`, the **Cadastros** section of the Configurações dialog, the sub-conta `code` in the cost center screens; `lib/billing-entry-payload.ts`, `lib/schemas/billing-entry.ts`, `billing-event.ts`.

## O — Operations
Done in this order: `CostCenter.code` and its migration; events; entries, rules and API; the issuance; the generated client; the frontend (events, entries screen, settings links). See *Pending before done* for what is left.

## N — Norms
`conventions/practices.md` §2–§3b; frontend: `operations/new-resource-page.md` and `norms/forms.md`.

## S — Safeguards
- Money: the sum of the unit amounts of a collective or fraction launch equals its total to the cent; a launch never produces a zero or negative line.
- A launch cannot reach a condominium other than its own (units and subconta are checked against it).
- The issuance stays idempotent: the same month issued twice adds nothing.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_billing_entry_api.py::test_event_crud_and_unique_code`, `::test_events_of_another_company_are_invisible` |
| R2 | `apps/billing/tests/test_billing_entry_api.py::test_create_an_entry_with_its_units`, `::test_a_bad_unit_is_reported_under_units`, `::test_an_empty_selection_is_refused`, `apps/billing/tests/test_billing_entry.py` (rules, template choice, event of another company, unit amount only individual) |
| R3 | `apps/billing/tests/test_billing_entry.py::test_individual_gives_each_unit_the_amount_or_its_own`, `::test_collective_splits_equally_and_the_parts_add_up`, `::test_fraction_splits_by_the_selected_units_fractions`, `apps/billing/tests/test_billing_entry_api.py::test_a_fraction_entry_needs_units_with_that_fraction` |
| R4 | `apps/billing/tests/test_billing_entry.py::test_once_covers_only_its_month`, `::test_installments_cover_n_months_and_say_which`, `::test_always_runs_until_it_is_ended`, `::test_the_queryset_agrees_with_covers` |
| R5 | `apps/billing/tests/test_issue_condominium_billing.py::test_a_launch_is_added_after_the_plan_in_its_own_cost_center`, `::test_a_launch_only_reaches_the_units_it_selects_and_a_month_with_only_launches_is_issued`, `::test_an_installment_that_is_over_is_not_billed_again` |
| R6 | `apps/billing/tests/test_billing_entry_api.py::test_preview_answers_the_per_unit_values_without_saving` |
| R7 | `apps/billing/tests/test_billing_entry_api.py::test_the_list_of_a_month_carries_the_values_of_that_month`; the grid sums: `frontend/tests/billing-entry.test.mjs` |
| R8 | `apps/billing/tests/test_billing_entry.py::test_an_entry_a_document_was_issued_from_cannot_change_or_go`, `apps/billing/tests/test_billing_entry_api.py::test_a_used_entry_cannot_be_changed_or_deleted_but_can_be_ended` |
| R9 | `apps/billing/tests/test_billing_entry_api.py::test_entries_of_another_company_are_invisible` |
| sub-conta code | `apps/finance/tests/test_cost_centers.py::test_the_code_is_assigned_in_order_when_left_out`, `::test_a_code_is_unique_per_condominium`, `::test_the_api_shows_and_accepts_the_code` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`); `pnpm exec tsc --noEmit`, `eslint` and `pnpm build` clean
- [x] `docs/apps/billing.md`, `docs/apps/finance.md` and the frontend docs updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated (if **Roadmap** is set): `N/A — Roadmap: none`; index in `features/README.md` updated

## Pending before `done`
The spec stays `in-progress` until the user confirms the three decisions marked *agent, to be confirmed* (the per-condominium sub-conta code instead of the company-wide catalog, the fraction/collective split arithmetic, the `billing_entry` link on document items) and has used the screen on real data. Known follow-ups, each its own spec: the company-wide sub-conta catalog; the **Extra** boleto; negative values (discounts); "Lançar em lote" (the user may want it later); the registration fee, now implemented as an event of the administradora ([038](038-registration-fee.md)); the payment at the administradora's counter. The screen was exercised in a real browser (login, event, launch with preview, grid, delete/end buttons, Configurações → Cadastros), but not yet through a full monthly issuance on a gateway-connected condominium.
