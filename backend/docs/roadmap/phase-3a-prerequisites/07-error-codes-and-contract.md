---
summary: Plan and status of part 07 of phase 3a — Error codes and API contract cleanup.
read-when: you work on error codes and api contract cleanup before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 07 — Error codes and API contract cleanup

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** core, condominiums, persons, finance, frontend · **Frontend impact:** client regeneration · **Depends on:** 05
**Spec:** [006 — Error codes and API contract cleanup](../../features/006-error-codes-and-contract.md)

## Goal
Every model error carries a stable `code`; the frontend translates by code. In the same wave `upcoming_adjustments[].index` becomes `adjustment_index`, so the client is regenerated once. Decided in gaps #6 and #23.

## Scope
- [x] Give every validator, `clean()` check and constraint (`violation_error_code`) a stable code
- [x] Exception handler that returns the code next to the message; document the shape in `architecture/api.md` and in the OpenAPI schema
- [x] Rename `upcoming_adjustments[].index` to `adjustment_index` (backend, frontend, client)
- [x] Frontend: translate by code, with the English message as fallback; remove the string-matching map
- [x] Regenerate the client once; update `conventions/naming.md` §14; delete gaps #6 and #23

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 006 `done`). Every validator, `clean()` check and constraint has a stable code (apps' `error_codes.py` `StrEnum`s + the generic Django/DRF/SimpleJWT codes in `core/error_registry.py`); `api_exception_handler` rebuilds every error body as `{errors: [{field, code, message}]}` (statuses unchanged, 500 untouched); the OpenAPI hook adds `ErrorCodeEnum`, `ErrorItem`, `ErrorResponse` and the 4xx responses; the frontend translates by code through an exhaustive `Record<ErrorCodeEnum, string>`; `upcoming_adjustments[].index` is `adjustment_index`.
Constraint changes are metadata only: the three generated migrations (`condominiums.0003`, `finance.0002`, `persons.0004`) are `AlterConstraint` and `sqlmigrate` prints no SQL. The CPF/CNPJ messages are English.
Checked: `pytest apps -q` 332 passed, `mypy apps config` clean, frontend `tsc`, `eslint` and `build` clean with the regenerated client.
Deviations to confirm with the user (in the spec's Decisions): one code for the variable-fee rule; the schema hook builds plain dicts; a few messages unified and three constraints given messages.