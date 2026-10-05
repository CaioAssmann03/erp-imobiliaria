---
summary: Spec: every API error is a flat {errors: [{field, code, message}]} with a stable code (domain codes model.field.reason, Django/DRF codes kept); the frontend translates by code; adjustment_index replaces the vague index field in the same client regeneration.
read-when: you add a validation rule or a constraint, change an error response, translate an error in the frontend, or touch the dashboard adjustment field names
skip-if: company scoping errors only → features/004-company-scoping.md; login throttle and token errors → roadmap/phase-3a-prerequisites/08-auth-hardening.md; the general API rules → architecture/api.md
---
# 006 — Error codes and API contract cleanup

**Status:** done · **Level:** full · **Roadmap:** phase 3a part 07 · **Apps:** core, accounts, persons, condominiums, finance, frontend · **Frontend impact:** client regeneration (error shape, `adjustment_index`) and a rewritten error mapping

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Every model error carries a stable `code`; the frontend translates by code, with the English message as fallback (gap #6) | the user |
| 2026-10-05 | `upcoming_adjustments[].index` becomes `adjustment_index` in the same wave, so the client is regenerated once (gap #23) | the user |
| 2026-10-05 | Error body is the flat list `{errors: [{field, code, message}]}` | the user |
| 2026-10-05 | The shape applies to **every** error response (400, 401, 403, 404, 405, 429...), through one exception handler; `field` is null when the error is not about a field | the user |
| 2026-10-05 | Domain codes are dotted `model.field.reason` (e.g. `unit.ideal_fraction.sum_exceeds_total`); the generic Django/DRF codes (`required`, `blank`, `null`, `invalid`, `max_length`, `unique`, `does_not_exist`...) stay as they are | the user |
| 2026-10-05 | The variable-fee rule is one rule with one code (`administration_contract.variable_fee.requires_percentage_and_basis`) used by both `clean()` errors and the constraint, because a single constraint guards percentage and basis together | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | The error side of the OpenAPI schema is added by a postprocessing hook with plain schema dicts (`apps/core/schema.py`), not by serializers | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | Constraint and `clean()` messages of one rule are shared constants and end with a period (a few were unified); three constraints that had no message got one (unit unique per block, unit unique per condominium, utility values) | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | Codes are registered per app in `apps/<app>/error_codes.py` (a `StrEnum`); `core` collects them for the OpenAPI schema without importing the apps by name | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Shared validators are field-agnostic, so their codes are `<validator>.<reason>` (`cpf.invalid_length`, `cnpj.invalid_check_digits`, `percentage.out_of_range`...) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Nested errors use a dotted path in `field`, with list positions as numbers (`address.city`, `unit_people.0.person`) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The schema exposes `ErrorResponse` and an `ErrorCode` enum, so the generated client has the union type and the frontend map is `Record<ErrorCode, string>`: an untranslated code is a compile error | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Guard tests: every constraint has a `violation_error_code`; every `ValidationError(` in a model or validator has `code=`; codes are unique across apps | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The CPF/CNPJ validators' Portuguese messages become English (the API sends English only), and the typo "coast center" is fixed | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | HTTP statuses do not change; 500 responses are not reshaped (no internal detail leaves the server) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The code catalog is part of the contract: adding a code is compatible, renaming or removing one is breaking and needs a spec | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
The API mixes the model's English messages with Django/DRF built-ins (Portuguese because of `LANGUAGE_CODE="pt-br"`), the CPF/CNPJ validators speak Portuguese, and the frontend guesses by substring (`lib/form-errors.ts`). A code lets the frontend translate reliably; the message stays as the English fallback.
- [x] R1 — Every domain rule (field validator, `clean()` check, constraint) carries a stable code; a rule's message and code are identical in `clean()` and in its constraint (`violation_error_code`)
- [x] R2 — Every error response (400, 401, 403, 404, 405, 429...) has the body `{errors: [{field, code, message}]}` with the unchanged HTTP status; 500 is not reshaped
- [x] R3 — `field` is the dotted path of the field (`address.city`, `unit_people.0.person`) and null for errors not about a field (`non_field_errors`, `detail`)
- [x] R4 — Generic Django/DRF errors keep their own codes (`required`, `blank`, `null`, `invalid`, `max_length`, `unique`, `does_not_exist`); authentication and permission errors use the DRF/SimpleJWT codes (`not_authenticated`, `authentication_failed`, `token_not_valid`, `permission_denied`, `not_found`, `throttled`)
- [x] R5 — Messages are English: the CPF/CNPJ validators are fixed and the "coast center" typo is gone
- [x] R6 — The OpenAPI schema contains `ErrorResponse` and the `ErrorCode` enum (every registered code) and the generated client exposes them
- [x] R7 — The frontend translates by code through a `Record<ErrorCode, string>` map, falls back to the English message for an unknown code, reads the new shape in the login/refresh flows too, and the substring `translate()` is removed
- [x] R8 — `upcoming_adjustments[].index` is `adjustment_index` in the backend (view, serializer, schema), the frontend and the client
- [x] R9 — The guard tests of the Decisions table fail when a constraint lacks a code, a `ValidationError(` lacks `code=`, a code is duplicated, or a registered code has no frontend translation (TypeScript compile)
- [x] R10 — `architecture/api.md` (errors), `conventions/naming.md` (code naming), `conventions/practices.md` (how to add a rule with its code) are updated; gaps #6 and #23 are deleted

## E — Entities
No table changes. Constraints change only in their message/code metadata (see Safeguards for the migration check).

Initial code catalog (proposed; each row is one rule found in the code on 2026-10-05, plus the rules of spec 004). Names are final once this spec is `ready`:
| Source | Code | Message (English, unchanged unless noted) |
|---|---|---|
| `validate_cpf` | `cpf.invalid_length` | CPF must have 11 digits, no punctuation (was Portuguese) |
| `validate_cpf` | `cpf.invalid_check_digits` | Invalid CPF (was Portuguese) |
| `validate_cnpj` | `cnpj.invalid_length`, `cnpj.invalid_check_digits` | CNPJ must have 14 characters, no punctuation; Invalid CNPJ (were Portuguese) |
| `validate_percentage` | `percentage.out_of_range` | Percentage must be between 0 and 100. |
| `validate_due_day` | `due_day.out_of_range` | Due day must be between 1 and 28. |
| `validate_ideal_fraction` | `ideal_fraction.out_of_range` | Ideal fraction must be greater than 0 and at most 1. |
| `validate_non_negative` | `value.negative` | Value cannot be negative. |
| `AdministrationContract` | `administration_contract.fee_amount.required_for_fixed`, `administration_contract.variable_fee.requires_percentage_and_basis` (one rule, one code, on `fee_percentage` or `fee_basis`), `administration_contract.fee_floor.exceeds_ceiling` | Fixed fee requires an amount. / Variable fee requires percentage and basis. / Floor cannot exceed ceiling. |
| `BillingRules` | `billing_rules.due_day.out_of_range`, `billing_rules.early_payment_discount_percentage.out_of_range` | Due day must be between 1 and 28 / Discount must be between 0 and 100 |
| `Block` | `block.name.duplicate_in_condominium` | This condominium already has a block with this name |
| `Unit` | `unit.block.other_condominium`, `unit.ideal_fraction.out_of_range`, `unit.ideal_fraction.sum_exceeds_total`, `unit.name.duplicate_in_block`, `unit.name.duplicate_in_condominium`, `unit.utility_values.negative` | Block belongs to another condominium. / Ideal fraction... / Ideal fractions of the condominium's active units would exceed 1. / (the two unique and the non-negative constraints get messages) |
| `UnitPerson` | `unit_person.end_date.before_start_date`, `.ownership_percentage.required_for_owner`, `.ownership_percentage.not_allowed_for_tenant`, `.ownership_percentage.sum_exceeds_100`, `.person.duplicate_active_link` | End date cannot be before start date. / Owner needs a percentage between 0 and 100. / Tenant cannot have an ownership percentage. / Owners of this unit would exceed 100% at the same time. / This person already has an active link with this role |
| `CostCenter` | `cost_center.name.duplicate_in_condominium` | This condominium already has a cost center with this name |
| `EntryTemplate` | `entry_template.admin_fee_incidence_percentage.out_of_range`, `entry_template.name.duplicate_in_cost_center` | Percentage must be between 0 and 100 / This cost center already has an entry template with this name (typo fixed) |
| spec 004 | `condominium.advisor.other_company`, `unit_person.person.other_company`, `people_individual.company.mismatch`, `people_individual.cpf.duplicate_in_company`, `people_legal.cnpj.duplicate_in_company` | to be written with spec 004's rules |
| generic | `required`, `blank`, `null`, `invalid`, `max_length`, `unique`, `does_not_exist`, `not_authenticated`, `authentication_failed`, `token_not_valid`, `permission_denied`, `not_found`, `method_not_allowed`, `throttled`, `parse_error` | the framework's message |

Response shape:
```json
{"errors": [
  {"field": "administration_contract.fee_amount", "code": "administration_contract.fee_amount.required_for_fixed", "message": "Fixed fee requires an amount."},
  {"field": null, "code": "not_authenticated", "message": "Authentication credentials were not provided."}
]}
```

## A — Approach
- **One handler, one shape.** `config/settings.py` points `REST_FRAMEWORK["EXCEPTION_HANDLER"]` to `apps/core/exception_handler.py`. It calls DRF's default handler (so statuses and DRF/SimpleJWT exceptions behave as today), then rebuilds the body: it walks the `ErrorDetail` tree, which carries each message and its `code`, into the flat list with dotted `field` paths.
- **Codes live next to the rule.** Validators get `ValidationError(message, code=...)`, `clean()` builds `ValidationError({field: ValidationError(message, code=...)})`, constraints get `violation_error_code`. `ModelRulesMixin`'s `_to_drf_errors` keeps the code instead of flattening to strings (it reads `error.error_dict` with its per-field `ValidationError` objects, not `message_dict`).
- **Registry.** Each app declares its domain codes in `apps/<app>/error_codes.py`; rules import the member (`UnitErrorCode.IDEAL_FRACTION_SUM_EXCEEDS_TOTAL`), never a bare string. `core` discovers the modules through `django.apps` for the schema enum and the duplicate check.
- **Schema and client.** Serializers `ErrorItem` (`field`, `code`, `message`) and `ErrorResponse` in `apps/core/serializers/error_serializers.py`, with `code` as a choice field over every registered code; a drf-spectacular postprocessing hook attaches `ErrorResponse` to the 4xx responses. The exact mechanism is verified in the first step of Operations.
- **Frontend.** `lib/error-messages.ts` holds `Record<ErrorCode, string>` (Portuguese). `lib/form-errors.ts` reads `errors[]`: it sets the field error by `field` (full path first, then the last segment, as the flat forms do today), and a null `field` becomes the general message. The substring `translate()` is deleted.
- **Rejected:** keeping `{field: [message]}` and adding a parallel `codes` map (message and code drift apart); translating on the server (breaks the English-only API rule).

## S — Structure
| File | Change |
|---|---|
| `config/settings.py` | `EXCEPTION_HANDLER`; spectacular postprocessing hook |
| `apps/core/exception_handler.py` | new: flat body from the DRF `ErrorDetail` tree |
| `apps/core/error_codes.py` | new: collects the apps' registries; generic codes; duplicate check |
| `apps/core/serializers/error_serializers.py` | new: `ErrorItem`, `ErrorResponse`; `apps/core/schema.py`: postprocessing hook |
| `apps/core/serializers/model_rules.py` | `_to_drf_errors` keeps codes |
| `apps/<app>/error_codes.py` | new, per app: `core`, `persons`, `condominiums`, `finance` |
| `apps/core/validators/*.py`, `apps/condominiums/validators.py` | codes; English CPF/CNPJ messages |
| `apps/*/models/*.py` | `ValidationError` with codes in every `clean()`; `violation_error_code` on every constraint |
| `apps/core/views/dashboard_views.py`, `apps/core/serializers/dashboard_serializers.py` | `index` to `adjustment_index` |
| `frontend/lib/error-messages.ts`, `frontend/lib/form-errors.ts` | code map; new reader; login/refresh flows |
| `frontend/lib/api/generated/` | regenerated client (`npm run generate:api`) |
| `apps/core/tests/test_error_contract.py`, `apps/core/tests/test_error_codes.py`, per-app tests | tests |
| `docs/architecture/api.md`, `conventions/naming.md`, `conventions/practices.md`, `known-gaps.md` | docs |
No route changes.

## O — Operations
Depends on phase 3a part 05 (spec 004 adds rules and constraints that need codes).
1. Spike inside the work: the handler plus the postprocessing hook on one endpoint, checking the generated schema and that `orval` types the `ErrorCode` enum; adjust the mechanism if drf-spectacular cannot do it in one hook.
2. `error_codes.py` per app and in `core`; the exception handler; `_to_drf_errors`; their tests.
3. Apply codes to validators, `clean()` and constraints, app by app; fix the CPF/CNPJ messages and the typo; `makemigrations` and check the SQL (`sqlmigrate`).
4. Guard tests.
5. Rename `index` to `adjustment_index`.
6. Regenerate the client; frontend map, reader, login/refresh; remove `translate()`; `npx tsc --noEmit`, `npx eslint .`, `npm run build`.
7. Docs; delete gaps #6 and #23.

## N — Norms
`conventions/practices.md` §2–3 (rules and messages only in models), `architecture/api.md` (errors), `conventions/naming.md` (§14: contracts rename only through a spec; code naming added here), spec 004 (read-only company, 404/400 for foreign ids use the generic `does_not_exist`).

## S — Safeguards
- **Security:** an error never carries internal detail; 500 is untouched; `does_not_exist` for a foreign-company id stays indistinguishable from a missing one (spec 004). Codes are not secrets but must not encode data (no ids or values in a code).
- **Backward compatibility:** this is a breaking contract change on purpose (the error body and `index`). Backend, frontend and client change together in one release; nothing else consumes the API today.
- **Migrations:** changing only a constraint's message or code should not change the database. `sqlmigrate` of the generated migrations must show no DDL for those constraints (on Django 6.1 this is a state-only change; if it recreates a constraint, the step stops and the spec is revisited).
- **Integrity:** a rule's message and code are identical in `clean()` and in its constraint, now enforced for the code too (the guard test compares them).
- **Performance:** the handler runs only on errors.
- **Failure modes:** an unregistered code in a rule fails the guard test, not the request; an unknown code from a newer backend shows the English message in an older frontend (fallback).

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/test_error_codes.py::test_every_constraint_has_a_violation_error_code`, `::test_every_constraint_code_is_registered`, `::test_every_validation_error_in_models_and_validators_has_a_code` (AST scan), `::test_contract_clean_and_constraint_share_message_and_code`, `::test_unit_person_clean_and_constraint_share_message_and_code`, `::test_unit_ideal_fraction_validator_and_constraint_share_the_message`, `apps/core/tests/test_error_contract.py::test_model_rule_codes_reach_the_api` |
| R2 | `apps/core/tests/test_error_contract.py::test_validation_error_is_a_flat_error_list`, `::test_401_has_the_same_shape`, `::test_403_has_the_same_shape`, `::test_404_has_the_same_shape`, `::test_405_has_the_same_shape`, `::test_malformed_json_has_the_same_shape`, `::test_status_codes_are_unchanged`, `::test_500_is_not_reshaped` |
| R3 | `apps/core/tests/test_error_contract.py::test_nested_error_uses_dotted_path`, `::test_list_position_is_a_number_in_the_path`, `::test_non_field_error_has_null_field` |
| R4 | `apps/core/tests/test_error_contract.py::test_generic_codes_are_kept`, `::test_login_failure_and_missing_token_codes`, `::test_every_code_answered_is_registered` |
| R5 | `apps/core/tests/validators/test_cpf.py::CpfValidatorTests::test_errors_have_english_messages_and_stable_codes`, `apps/core/tests/validators/test_cnpj.py::test_errors_have_english_messages_and_stable_codes`; the "coast center" typo was fixed in phase 3a part 02 |
| R6 | `apps/core/tests/test_error_contract.py::test_schema_contains_error_response_and_error_code_enum`, `::test_schema_attaches_the_error_responses_to_the_operations` |
| R7 | gap: the frontend has no test suite; verified by `npx tsc --noEmit` (the exhaustive `Record<ErrorCodeEnum, string>`: removing one entry makes the compile fail, checked), `npx eslint .` and `npm run build`; the login form only reads the 401 status, so it needed no change; a failing condominium form and a failed login were not exercised in a browser |
| R8 | `apps/core/tests/test_core_dashboard.py::test_upcoming_adjustments_expose_adjustment_index` |
| R9 | `apps/core/tests/test_error_codes.py::test_codes_are_unique_across_apps`, `::test_codes_have_the_dotted_lowercase_shape`, `::test_every_app_registry_is_found`; the missing-translation case is the TypeScript compile in R7 |
| R10 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean; `sqlmigrate` shows no DDL for the metadata-only constraint changes
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`npm run generate:api`; `npx tsc --noEmit`, `npx eslint .`, `npm run build`)
- [x] `docs/architecture/api.md`, `conventions/naming.md`, `conventions/practices.md`, `apps/core.md` updated; gaps #6 and #23 deleted from `docs/known-gaps.md`
- [x] Roadmap part 07 and the phase 3a table updated; index in `features/README.md` updated
