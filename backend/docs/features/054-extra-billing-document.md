---
summary: Spec 054 — the extra boleto: a standalone boleto outside the monthly issuance, for one or more units of a condominium, with its own due date and lines.
read-when: you change how an extra (avulso) boleto is issued, its API, its screen, or how it differs from the monthly document
skip-if: the monthly issuance and the launches → apps/billing.md; discounts (negative values) → features/055-discounts-negative-values.md; the gateway registration → apps/billing.md
---
# 054 — Extra billing document (boleto extra)

**Status:** in-progress (built; waiting for the "agent, to be confirmed" decisions) · **Level:** full · **Roadmap:** none · **Apps:** billing, frontend · **Frontend impact:** client regeneration, new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | The **boleto extra** is a standalone boleto, **outside the monthly issuance**, to charge an extra call (works, a fine, an odd fee) from one or more units, with its own due date and lines, without waiting for the month. It enters the statement like the normal boleto and carries the registration fee | the user |
| 2026-10-29 | An extra is a `BillingDocument` with `kind = extra` (`monthly` stays the default). The one-per-unit-and-month rule applies **only to monthly** documents, so a unit can have several extras in a month and one monthly | agent, to be confirmed |
| 2026-10-29 | Its lines are written like the launches of *Inclusão de valores*: an optional event, a description, an allocation (**individual**: every selected unit pays the amount; **collective**: the total split equally; **fraction**: the total split by an apportionment criterion), the amount, and the sub-conta (none for an event of the administradora, such as the registration fee). The sub-conta's entry template is its only active one, or the line must name it | agent, to be confirmed |
| 2026-10-29 | The staff **adds the registration fee as a line** (event 0005 TARIFA BANCO, individual, the fee's value), as on the monthly boleto; the screen has a button for it. Nothing is added silently | agent, to be confirmed |
| 2026-10-29 | The competence month is chosen (it defaults to the month of the due date); `reference_month` equals it. The late-payment and discount terms are copied from the condominium's rules like the monthly document | agent, to be confirmed |
| 2026-10-29 | The payer is the unit's current payer (`Unit.billing_payer`). A selected unit with no payer, with no tax id while the gateway is active, or inactive is **skipped and told** in the answer; the others are issued. Each unit is issued in its own transaction | agent, to be confirmed |
| 2026-10-29 | The manager-unit exemption of the billing rules does **not** apply to an extra (the staff chose the unit); a billing-blocked unit is still skipped. The selected units are re-checked at issuance; the line shares are computed over the billable ones | agent, to be confirmed |
| 2026-10-29 | After the commit, each extra gets its PDF draft and (with an active gateway account) its registration, through the same tasks as the monthly one | agent, to be confirmed |

## R — Requirements
- [x] R1 — `POST /api/billing-documents/extra/` takes `condominium`, `due_date` (not in the past), `competence_month` (first day), `units` (at least one, of the condominium) and `lines` (at least one) and answers `issued` (documents) and `skipped` (`{unit, unit_name, code}`): 201 when at least one unit was issued, 200 when none was
- [x] R2 — Each issued document has `kind = extra`, the items computed by the lines' allocation over the units that were issued, the amount equal to the sum of its items, and the terms of the condominium's rules; it can coexist with the unit's monthly document of the same month
- [x] R3 — A line is valid like a launch: an event of the administradora has no sub-conta; any other line needs one (of the condominium, active) and an entry template; `fraction` needs a criterion of the condominium; a unit with no fraction in it pays nothing for that line (as in the monthly issuance)
- [x] R4 — A unit that is inactive or billing-blocked, with no current payer, or without tax id (active gateway) is skipped with its code and does not block the others; the shares are split among the units that can be issued, so a skipped unit's part is not lost; a unit left with no value is skipped as `nothing_to_bill`
- [x] R5 — Every issued document gets its PDF draft and, with an active account, its registration after the commit
- [x] R6 — `billing-documents` carry `kind`, accept `?kind=`, and the documents screens show a tag "Extra"
- [x] R7 — The screen **Cobrança → Boleto extra**: condominium, competence month, due date, the units (all or chosen), the lines (event, description, allocation, criterion, amount, sub-conta) and the **tarifa de registro** button; after issuing, it lists the documents and the skipped units
- [x] R8 — Another company's condominium or unit is refused; nothing is created when the data is invalid

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `billing.BillingDocument` | `kind` | `monthly` (default) / `extra`; the unique `(unit, reference_month)` constraint applies only while `kind = monthly` and the status is not `cancelled` |

## A — Approach
- **One document model.** The payment, registration, PDF, e-mail, overdue handling, reissue and the reports all already work on `BillingDocument`; an extra only differs by `kind` and by how it is created, so none of them changes.
- **A service per use case:** `services/issue_extra_billing_document.py` validates the lines, computes the shares with an in-memory `BillingEntry` (the same `amounts_by_unit` the launches use, no new arithmetic), builds a `NewBillingDocument` per unit and calls `create_billing_document` in its own transaction, then schedules the PDF and the registration like `_issue_unit` does. The rules (line validity, payer) stay in the models (`BillingDocumentItem`, `BillingDocument`) and the existing queries.
- **Request validation** in a serializer (`ExtraBillingDocumentSerializer`) that only shapes the input; the rules are the models' (`full_clean` of each document and item) and of `BillingEntry` for the allocation.
- Rejected: reusing `BillingEntry` with a "once, no month" mode (the monthly issuance would pick them up); a separate model (it would duplicate the payment and gateway code).

## S — Structure
| Method | URL | Request | Response |
|---|---|---|---|
| POST | `/api/billing-documents/extra/` | `condominium`, `due_date`, `competence_month`, `units[]`, `lines[]` | 201 `{issued: [BillingDocument], skipped: [{unit, unit_name, code}]}` |
| GET | `/api/billing-documents/?kind=extra` | | filter |

Files: `billing/models/billing_document.py` (+ migration `0017_billing_document_kind`), `billing/services/issue_extra_billing_document.py`, `billing/serializers/extra_billing_document_serializers.py`, `billing/views/billing_document_views.py` (the `extra` action), `billing/filters.py`, `billing/errors/billing_document.py`, `billing/models/rules/billing_document.py` (the due-date rule), `billing/services/schedule_billing_document_tasks.py` (shared with the monthly issuance); frontend `app/(dashboard)/billing/extra/**`, `lib/schemas/extra-billing-document.ts`, `lib/module-menu.ts`, `lib/error-messages.ts`, the documents list/page tag; docs.

## O — Operations
1. Model field + migration; constraint change; filter and serializer field.
2. Service and tests (shares, payer skips, coexistence with monthly, scoping, tasks scheduled).
3. Endpoint; regenerate the client.
4. Screen, menu, documents tag; docs; gate.

## N — Norms
Rules in models; one service per use case; no `ValidationError` built in the service (the models raise); frontend tokens only, Portuguese UI.

## S — Safeguards
- **Money:** the amount is the sum of the items and the model re-checks it; shares add up to the line's total (the launches' rounding, the leftover cents to the largest fraction); the registration-fee line is credited to the administradora's ledger on payment like the monthly one.
- **Idempotency:** an extra is a new boleto each time (no uniqueness by month); the screen disables the button while issuing to avoid a double click, and the answer lists what was created.
- **Scoping:** the condominium, units, events, sub-contas and criterion must belong to the user's company; another's id is a 400 `does_not_exist`.
- **Compatibility:** `kind` is additive; existing documents are `monthly`; the monthly issuance and the unique rule behave as before.

## Test plan
| Criterion | Test |
|---|---|
| R1–R5, R8 | `billing/tests/test_extra_billing_document.py` |
| R6 | `billing/tests/test_extra_billing_document.py` (kind and filter) |
| R7 | `frontend/tests/extra-billing.test.mjs` (the payload builder); the screen checked by hand in the browser (Playwright run: form, fee line, result with skipped unit, documents list tag) — no automated screen test |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan, or a written gap
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
