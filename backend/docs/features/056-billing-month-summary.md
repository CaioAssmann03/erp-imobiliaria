---
summary: Spec 056 — a read-only summary of the boletos per reference month (issued, paid and open, count and amount) for the dashboard card and its chart.
read-when: you build or change the dashboard's "Emissão do mês" card, its issued × received chart, or the billing-documents summary endpoint
skip-if: the overdue boletos report → features/052-reports-delinquency-and-accountability.md; the boleto record and its statuses → apps/billing.md; the dashboard's other numbers → apps/core.md
---
# 056 — Billing month summary

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** billing · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | Add a new read-only endpoint instead of summing boletos in the browser (the list API has no totals) | user |
| 2026-10-30 | Both kinds (monthly and extra) count; cancelled boletos never do. *Issued* = paid + open; *open* = issued or registered | agent, to be confirmed |
| 2026-10-30 | The last `months` months (default 6, 1–12) ending at the current month, oldest first; a month with no boleto appears with zeros | agent, to be confirmed |

## R — Requirements
The dashboard needs the money of the month: how much was issued, how much was received and how much is open, and the same for the last months as a chart.
- [x] R1 — `GET /api/billing-documents/summary/` answers one line per reference month, oldest first, with `issued_*`, `paid_*` and `open_*` (count and amount); cancelled boletos are left out
- [x] R2 — `?months=` sets how many months (default 6, 1–12; another value is a 400); months with no boleto come with zeros
- [x] R3 — it honours the viewset's filters (`?condominium=`) and only covers the user's company

## E — Entities
`No schema change.`

## S — Structure
- `apps/billing/services/build_billing_month_summary.py` — `build_billing_month_summary(documents, months, today)` returns a list of `BillingMonthSummary` (one aggregate query)
- `apps/billing/serializers/billing_month_summary_serializers.py` — the line and the query-string serializer; exported in `serializers/__init__.py`
- `apps/billing/views/billing_document_views.py` — the `summary` list action (`operation_id="billing_documents_summary"`)
- Response: `[{reference_month, issued_count, issued_total, paid_count, paid_total, open_count, open_total}]`

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_billing_month_summary.py::test_sums_issued_paid_and_open_per_month_and_skips_cancelled` |
| R2 | `apps/billing/tests/test_billing_month_summary.py::test_fills_empty_months_and_validates_the_months_parameter` |
| R3 | `apps/billing/tests/test_billing_month_summary.py::test_filters_by_condominium_and_ignores_other_companies` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/apps/billing.md` updated; roadmap part/phase and the spec index updated (if applicable)
