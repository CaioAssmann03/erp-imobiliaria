---
summary: Spec 052 — the first two reports of the Relatórios menu, Inadimplência (overdue boletos) and Prestação de contas (a condominium's month in the ledger), on screen with a PDF download.
read-when: you build or change a report, its endpoints, its PDF, or the Relatórios screens
skip-if: the boleto and its status → apps/billing.md; the ledger and balances → apps/finance.md; the shell and the menu → features/history.md (spec 049)
---
# 052 — Reports: Inadimplência and Prestação de contas

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** billing, finance, frontend · **Frontend impact:** client regeneration, new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | Start with **Inadimplência** and **Prestação de contas**, each on screen with filters, totals and a **PDF** download. **Ficha da unidade** and **Taxa de administração** are a second round (they stay "Em breve") | the user |
| 2026-10-29 | **Inadimplência** lists the boletos still awaiting payment (`issued` or `registered`) whose due date is before today, with the days late; filters: condominium, reference month. Totals: count, amount, and the same per condominium. The amount is the boleto's face value (no fine or interest) | agent, to be confirmed |
| 2026-10-29 | **Prestação de contas** is one condominium and one month, from its current account by **`entry_date`** (the day the money moved, so opening balance + credits − debits = closing balance): opening balance, credits, debits and closing balance, **per sub-conta** and in total, and the list of entries of the month | agent, to be confirmed |
| 2026-10-29 | The endpoints answer the data as JSON and, on `/pdf/`, the PDF bytes directly (nothing stored in the bucket); a report holds at most 2000 rows, and says so (`truncated`) while totals cover everything | agent, to be confirmed |
| 2026-10-29 | Screens at `/reports` (the list of reports), `/reports/delinquency` and `/reports/accountability`; the menu items "Relatórios", "Inadimplência" and "Prestação de contas" link to them | agent, to be confirmed |

## R — Requirements
- [x] R1 — `GET /api/billing-documents/delinquency/` answers the overdue documents of the user's company (never another company's) with `as_of`, `count`, `total_amount`, `by_condominium` and `rows`; a paid, cancelled or not yet due document is not in it
- [x] R2 — It filters by `?condominium=` and `?reference_month=`; each row carries condominium, unit, payer, reference month, due date, `days_overdue` and amount; rows are ordered by condominium, then the oldest due date
- [x] R3 — `GET /api/billing-documents/delinquency/pdf/` answers the same report as a PDF (`application/pdf`, attachment) honoring the same filters
- [x] R4 — `GET /api/current-account-entries/accountability/?condominium=&month=` answers `opening_balance`, `total_credits`, `total_debits`, `closing_balance`, `by_cost_center` (each with its own opening, credits, debits, closing) and `entries` for the entries whose `entry_date` is in the month; `closing = opening + credits − debits` in total and per sub-conta
- [x] R5 — `condominium` and `month` (first day of a month) are required (400 with a coded error), a condominium of another company is a 404, a condominium with no entries answers zeros and no rows
- [x] R6 — `…/accountability/pdf/` answers the same report as a PDF
- [x] R7 — The screens show the filters, the totals, the table and a **Baixar PDF** button; the menu items open them
- [x] R8 — No report change touches data (read only) and every row of the PDF text is escaped

## E — Entities
N/A — no model, no migration. New read-only serializers and services.

## A — Approach
- **Where it lives.** The data's owner serves it: the overdue report is an `@action` of `BillingDocumentViewSet` (`delinquency`, `delinquency/pdf`), the accountability report one of `CurrentAccountEntryViewSet`. Both are company-scoped by the viewsets' own queryset.
- **Services build the report, the view only calls them** (`billing/services/build_delinquency_report.py`, `finance/services/build_accountability_report.py`: dataclasses of totals and rows) and **render** it (`render_delinquency_pdf`, `render_accountability_pdf`, WeasyPrint with the same refuse-every-URL fetcher as the boleto, templates in `infrastructure/rendering/templates/`). The business arithmetic (days late, balance per sub-conta) is in the service, not the serializer.
- **PDF in the response, not in the bucket:** a report is a view of data at a moment; storing it would only keep stale copies.
- Rejected: one `reports` app (it would import billing and finance and duplicate their scoping); pagination of a report (a report is whole, with a row cap).

## S — Structure
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/billing-documents/delinquency/` | `?condominium=`, `?reference_month=` | `DelinquencyReport` | company-scoped |
| GET | `/api/billing-documents/delinquency/pdf/` | same | `application/pdf` | |
| GET | `/api/current-account-entries/accountability/` | `condominium`, `month` | `AccountabilityReport` | 400 `report.*` when missing |
| GET | `/api/current-account-entries/accountability/pdf/` | same | `application/pdf` | |

Frontend: `app/(dashboard)/reports/page.tsx`, `reports/delinquency/page.tsx`, `reports/accountability/page.tsx` and their `_components/`; `lib/module-menu.ts` (three items get an `href`); `lib/reports.ts` (the PDF URL builder); docs.

## O — Operations
1. Services and templates, serializers, the four actions, error codes; tests.
2. Regenerate the client; the three screens; the menu links; the PDF download button.
3. Docs: `apps/billing.md`, `apps/finance.md`, `frontend/docs` (routes, scope), this spec; gate.

## N — Norms
Business rules in services/models, not serializers; one use case per service file; names in English, text in Portuguese on the screens; tokens only in the frontend.

## S — Safeguards
- **Scoping:** both reports read through the company-scoped viewset queryset; the condominium id of another company is a 404.
- **PDF:** the renderer refuses every URL and the templates escape every value (Django autoescape); the filename is built from numbers and dates only.
- **Performance:** one query per report plus the select_related of the rows; the row cap protects the PDF.
- **Compatibility:** purely additive.

## Test plan
| Criterion | Test |
|---|---|
| R1, R2 | `billing/tests/test_delinquency_report.py` |
| R3, R8 | `billing/tests/test_delinquency_report.py` (PDF) |
| R4, R5 | `finance/tests/test_accountability_report.py` |
| R6 | `finance/tests/test_accountability_report.py` (PDF) |
| R7 | `frontend/tests/module-menu.test.mjs`, `frontend/tests/app-shell.test.mjs` (links resolve to pages); the screens by hand in the browser: a gap written down |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [ ] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
