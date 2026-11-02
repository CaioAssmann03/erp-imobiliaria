---
summary: The ERP API scopes every request to the user's own company, superusers included; companies are listed, created and edited only in the Django Admin (no `/api/companies/`).
read-when: you touch company scoping or the superuser, or a list shows records of another company
skip-if: how a new model declares its company → architecture/overview.md (decision 10) and apps/core/infrastructure/scoping.py; the admin's own scoping → docs/apps/core.md
---
# 067 — API scope without superuser bypass

**Status:** done · **Level:** full · **Roadmap:** none · **Apps:** core (every app through `scope_to_company`) · **Frontend impact:** client regeneration (the `companies` endpoints disappear; no screen used them)

## Open questions
- None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-01 | The ERP API never shows another company's records, to anyone: `scope_to_company` has no superuser exception. The frontend does no company filtering of its own. | the user |
| 2026-11-01 | Companies are listed, created and edited only in the Django Admin: the `/api/companies/` endpoint is removed (nothing in the ERP used it). If a screen for the user's own company is ever needed, it gets its own endpoint, limited to that company. | the user |
| 2026-11-01 | The Django Admin keeps the superuser's all-company view (it is where companies are managed); the exception moves out of `scope_to_company` into the admin mixin. | agent (admin behavior is unchanged, so nothing to confirm) |

## R — Requirements
The dev database has 11 companies (load-test ones included) and the only superuser, `admin`, saw all of them in the ERP: the catalog of sub-contas listed each item 11 times, and every other list mixed companies.
A company's data must be invisible and untouchable through the API to everyone outside it, whatever their role.
- [ ] R1 — Every company-scoped list endpoint returns only the caller's company for a superuser too (`tests/scoping/test_company_scoping.py::test_superuser_sees_only_own_company`).
- [ ] R2 — A superuser opening a record of another company gets 404, as any user does (`…::test_superuser_cannot_open_other_company_record`).
- [ ] R3 — The dashboard and the global search of a superuser cover only their company (`tests/dashboard/test_dashboard_scope.py`).
- [ ] R4 — The API has no companies endpoint: list, detail and create answer 404 even to a superuser (`tests/company/test_company_api.py`); the company's rules (CNPJ) are tested on the model (`tests/company/test_core_company.py`).
- [ ] R5 — A relation field (`unit.condominium`, a criterion, a cost center) cannot point at another company's record, for a superuser too (`…::test_superuser_cannot_reference_other_company_record`).
- [ ] R6 — The Django Admin still shows a superuser every company and a non-superuser only their own (`tests/scoping/test_admin_scope.py`, unchanged).

## E — Entities
No schema change.

## A — Approach
`scope_to_company(queryset, user)` is the single decision and now only filters by `user.company_id` (anonymous: `none()`). The admin mixin (`CompanyScopedAdminMixin`) skips it for a superuser, so the all-company view lives where it is needed and nowhere else.
Rejected: a `?company=` parameter or a role-based cross-company API (no current need; add it with its own spec when a real cross-company screen exists). The audit found no gap besides the exception itself: every business model declares `company_lookup`, every viewset uses `CompanyScopedViewSetMixin` (the auth and the two webhooks are the only ones without it, and they have no user data to scope), and every relation field is `CompanyScopedPrimaryKeyRelatedField`.

## S — Structure
`apps/core/infrastructure/scoping.py` (`scope_to_company`, `CompanyScopedAdminMixin`); `apps/core/urls.py` and `views/`/`serializers/` lose the company viewset and serializer; tests in `apps/core/tests/scoping/`, `dashboard/`, `company/`. No endpoint changes.

## O — Operations
1. Remove the superuser branch from `scope_to_company`; give `CompanyScopedAdminMixin` its own superuser branch (queryset and foreign-key choices).
2. Update the tests that asserted the bypass; add R2 and R5.
3. Update `architecture/overview.md` decision 10, the roadmap part 05 note and `docs/apps/core.md`.

## N — Norms
`architecture/overview.md` decision 10 changes: "every user sees only its company's data, a superuser included; only the Django Admin shows every company".

## S — Safeguards
Security: closes the cross-company read and write for superusers in the API. Compatibility: no contract change; a superuser who relied on seeing other companies in the ERP now uses the Admin.
Compatibility: `/api/companies/` (list, read, edit own, create, delete) is removed; the generated client loses its `companies` hooks, which no screen used.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/scoping/test_company_scoping.py::test_superuser_sees_only_own_company` |
| R2 | `apps/core/tests/scoping/test_company_scoping.py::test_superuser_cannot_open_other_company_record` |
| R3 | `apps/core/tests/dashboard/test_dashboard_scope.py::test_superuser_dashboard_covers_only_own_company`, `::test_superuser_search_ignores_other_company_records` |
| R4 | `apps/core/tests/company/test_company_api.py::test_the_api_does_not_expose_companies` |
| R5 | `apps/core/tests/scoping/test_company_scoping.py::test_superuser_cannot_reference_other_company_record` |
| R6 | `apps/core/tests/scoping/test_admin_scope.py` (existing) |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated (if **Roadmap** is set); index in `features/README.md` updated
