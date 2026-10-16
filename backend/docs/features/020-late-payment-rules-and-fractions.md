---
summary: Spec: per-condominium late-payment rules (fine with a first-days tier, interest rates by start date, calculation and grace), the two competence settings and boleto display options on BillingRules, plus up to six ideal fractions per unit.
read-when: you touch BillingRules, the late fee or interest settings, the due-month or competence settings, LateInterestRate, a unit's ideal fractions or the apportionment pendency
skip-if: the monthly charge calculation and boleto documents → roadmap/phase-4-billing-generation/README.md; the address map → features/021-address-map.md; IDs and person modules → features/history.md (section 019)
---
# 020 — Late-payment rules, competence and six ideal fractions

**Status:** in-progress · **Level:** full · **Roadmap:** none (prerequisite of phase 4, see its Notes) · **Apps:** condominiums, core (dashboard text) · **Frontend impact:** new screens

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-16 | Scope is "package B" of the comparison with the Sami's condominium screens (late fee, interest, competence, boleto options) plus up to six ideal fractions per unit; the address map is spec 021 | the user |
| 2026-10-16 | Interest is calculated either as a **full month** (the month's rate from the first day of delay) or **per day** (rate ÷ 30 per day late), and starts the day after the due date or after N grace days; monetary correction is out of scope (it waits for an index catalog) | the user |
| 2026-10-16 | The competence is chosen per condominium: some boletos carry the competence of the due month, others do not | the user |
| 2026-10-16 | Competence is two settings, as in the Sami, both relative to a **reference month** (the month the issuance refers to): `due_month` (the due date falls in the reference month or in the next) and `competence_month` (the boleto's competence is the due month or the month before it). The screen shows an example sentence for a sample reference month, like the Sami's | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | `calculation_period` (`reference` / `following`, nothing reads it yet, `data.md` marked it *confirm*) is the Sami's "Vencimento no mês": it is renamed `due_month` as a model attribute and API field; the database column keeps its name, so an old container keeps working during a deploy | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | Late fee: a percentage plus an optional first-days tier ("X % in the first N days of delay"); both are capped at **2 %**, the Civil Code limit for condominium fees (art. 1.336 §1); a bigger value is a 400 | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | Interest rates are a history by start date (`LateInterestRate`, the Sami's "A partir de …, juros de 1%"), a flat resource like blocks, not a nested write; a condominium with no rate charges no interest | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | Defaults, for existing and new condominiums alike: no fine, no first-days tier, no interest rate, `full_month`, no grace, competence `same_as_due`, QR Code and fee statement off (the Sami's example shows "Nenhuma multa configurada"); the form does not pre-fill percentages | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | Fractions are five new nullable columns `ideal_fraction_2` … `ideal_fraction_6` beside `ideal_fraction` (the 1st): a fixed set of six from the reference system, an additive migration, and the billing plan items of phase 4 will name a fraction number | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | A fraction is *in use* when some active unit has it. Each fraction in use must sum 1 (the 1st always, as today); the six fractions share the error codes `unit.ideal_fraction.out_of_range` and `unit.ideal_fraction.sum_exceeds_total`, the response's `field` says which | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | The condominium page gets a read-only apportionment card (active units, total of each fraction) served by a separate `GET /api/condominiums/{id}/apportionment/`, so the list and detail payloads stay as they are | agent; confirmed by the user on 2026-10-16 |

## R — Requirements
The Sami's "Dados de cobrança" card holds the fine, the interest, the competence and the boleto options, and its "Frações" card holds up to six fractions per unit; here there is one fraction and none of the late-payment rules, so phase 4 (monthly charge, boleto) and phase 5 (reissue with fine and interest) have nowhere to read them.
- [ ] R1 — `BillingRules` gains `competence_month`, `late_fee_percentage`, `initial_late_fee_percentage`, `initial_late_fee_days`, `interest_calculation`, `interest_grace_days`, `should_show_qr_code` and `should_show_fee_statement`, and `calculation_period` becomes `due_month` (same values, same database column). A condominium saved before this spec reads back with the defaults of the decisions above
- [ ] R2 — `late_fee_percentage` and `initial_late_fee_percentage` are between 0 and 2 (validator, check constraint, API 400 `billing_rules.late_fee_percentage.out_of_range` on the field)
- [ ] R3 — The first-days tier is all or nothing: `initial_late_fee_percentage` and `initial_late_fee_days` are both set or both empty (rule and check constraint, 400 `billing_rules.initial_late_fee.incomplete`), and the days are at least 1 (400 `billing_rules.initial_late_fee_days.out_of_range`)
- [ ] R4 — `due_month` accepts `reference` and `following`, `competence_month` accepts `same_as_due` and `before_due`, `interest_calculation` accepts `full_month` and `per_day`; any other value is a 400
- [ ] R5 — From a reference month, `BillingRules.due_month_of` gives the reference month (`reference`) or the next (`following`), and `competence_month_of` gives the due month (`same_as_due`) or the month before it (`before_due`), as first days of month
- [ ] R6 — `LateInterestRate` (condominium, start date, monthly percentage) is served at `/api/late-interest-rates/` (list filtered by `condominium`, create, retrieve, update, delete), company-scoped: another company's rate is 404 and another company's condominium as a related id is 400 `does_not_exist`
- [ ] R7 — A condominium has one rate per start date (400 `late_interest_rate.start_date.duplicate_in_condominium`) and a percentage between 0 and 100; both are also database constraints
- [ ] R8 — `condominium.late_interest_rates.in_force_on(date)` returns the rate with the latest start date not after `date`, or `None` when there is none (no interest before the first rate)
- [ ] R9 — Deleting a condominium deletes its rates; the Django Admin edits them inline; their changes are in the audit log
- [ ] R10 — A unit has `ideal_fraction` and `ideal_fraction_2` … `ideal_fraction_6`, each empty or greater than 0 and at most 1 (validator, check constraint, 400 `unit.ideal_fraction.out_of_range` on the field)
- [ ] R11 — For each fraction, the active units of a condominium cannot sum more than 1 (tolerance 0.0001): saving a unit that would pass it is a 400 `unit.ideal_fraction.sum_exceeds_total` on that fraction's field; inactive units do not count and the unit being saved is not counted twice
- [ ] R12 — The apportionment pendency (dashboard counter and `?pending=inconsistent_apportionment`) flags an active condominium with active units when its 1st fraction does not sum 1, or when a 2nd–6th fraction is in use and does not sum 1 (tolerance 0.0001)
- [ ] R13 — `GET /api/condominiums/{id}/apportionment/` answers the number of active units and, for each of the six fractions, its total and whether it is inconsistent (the rule of R12); company-scoped
- [ ] R14 — The billing section of the condominium form shows due day, business day, due month, competence month with the example sentence, late fee, the first-days tier, interest calculation and grace days, the list of interest rates (add and remove; only when editing an existing condominium), the display options, the discount and the credit limit; server errors land on their field with a Portuguese message
- [ ] R15 — The unit form has the six fraction fields, and the condominium edit page shows the read-only apportionment card with a warning when a fraction is inconsistent
- [ ] R16 — The API client is regenerated and no screen sends or reads `calculation_period`
- [ ] R17 — The docs match: `apps/condominiums.md`, `architecture/data.md` (billing rules and apportionment rows), the frontend `entities/domain-model.md`, the Notes of phase 4 and its part 02

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `BillingRules` | `calculation_period` → `due_month` | attribute renamed, `db_column="calculation_period"`; `CharField(12)`, choices `reference` / `following` (`DueMonth`), default `reference` |
| `BillingRules` | add `competence_month` | `CharField(12)`, choices `same_as_due` / `before_due` (`CompetenceMonth`), default and `db_default` `same_as_due` |
| `BillingRules` | add `late_fee_percentage` | `Decimal(5,2)`, default and `db_default` 0, validator `validate_late_fee_percentage` (0–2, constant `MAX_LATE_FEE_PERCENTAGE`), check `billing_late_fee_0_2` |
| `BillingRules` | add `initial_late_fee_percentage`, `initial_late_fee_days` | `Decimal(5,2)` and `PositiveSmallInteger`, both null; same validator, days ≥ 1 (`billing_initial_late_fee_days_min_1`); all-or-none check `billing_initial_late_fee_all_or_none` and the rule `BillingRulesRules` |
| `BillingRules` | add `interest_calculation`, `interest_grace_days` | `CharField(12)` choices `full_month` / `per_day` (`InterestCalculation`), default and `db_default` `full_month`; `PositiveSmallInteger`, default and `db_default` 0 |
| `BillingRules` | add `should_show_qr_code`, `should_show_fee_statement` | `BooleanField`, default and `db_default` False |
| `LateInterestRate` (new) | `BaseModel` | `condominium` FK `CASCADE` (`late_interest_rates`); `start_date` date; `monthly_percentage` `Decimal(5,2)` with `validate_percentage`, check `late_interest_rate_percentage_0_100`; unique `(condominium, start_date)` (`late_interest_rate_unique_start_per_condominium`); ordering `-start_date`; `company_lookup = "condominium__company"` |
| `Unit` | add `ideal_fraction_2` … `ideal_fraction_6` | `Decimal(9,8)`, null, `validate_ideal_fraction`; one check each (`unit_ideal_fraction_N_0_1`); constant `Unit.IDEAL_FRACTION_FIELDS` lists the six names |

New error codes: `billing_rules.late_fee_percentage.out_of_range`, `billing_rules.initial_late_fee.incomplete`, `billing_rules.initial_late_fee_days.out_of_range`, `late_interest_rate.start_date.duplicate_in_condominium` (the percentage reuses the core `PERCENTAGE_OUT_OF_RANGE`; the fractions reuse the two `unit.ideal_fraction.*` codes).

Meaning of the two settings, for a reference month R:
| `due_month` | `competence_month` | Due | Competence |
|---|---|---|---|
| `following` | `same_as_due` | R + 1 | R + 1 (the Sami's example: reference 10/2026, both 11/2026) |
| `following` | `before_due` | R + 1 | R |
| `reference` | `same_as_due` | R | R |
| `reference` | `before_due` | R | R − 1 |

## A — Approach
- **Settings on `BillingRules`, rates as their own table.** The fine, the competence and the options are per-condominium settings (1:1, already nested in the condominium payload, written by `update_condominium` with `update_or_create(defaults=…)`, which needs no change). The interest is a *list by date*; the project writes lists as flat resources (blocks, unit links) and an atomic nested write of a list would need a rule in the serializer, so `LateInterestRate` copies the `Block` recipe.
- **Rules where the repo keeps them.** A single-field range is a validator plus a check constraint (as `due_day`); the cross-field all-or-none of the first-days tier is a `BillingRulesRules` class (`models/rules/billing_rules.py`) plus a check constraint. The 2 % limit is one named constant used by the validator and the constraints.
- **Competence as two relative settings** (not a free month offset): they match the two Sami fields and the user's description, and the table above is the whole behavior. `due_month_of` and `competence_month_of` pin the meaning for phase 4; the form's example sentence is the same table in TypeScript.
- **Fractions as columns.** The set is fixed at six and fractions 2–6 are optional, so five nullable columns are the smallest compatible change (an old container still reads and writes `Unit`). `UnitRules` gets one `@rule` per fraction sharing a helper, because a rule reports on exactly one field. Rejected: a `UnitFraction` child table (the cleaner relation, but it moves the 1st fraction, removes a column the old container reads and needs a nested write), and an `ArrayField` (no per-element constraints).
- **The apportionment card has its own endpoint** (`@action` on the condominium viewset) so the list and the detail do not pay for six sums per row; its totals and the pendency use the same `UnitQuerySet` method, so they cannot disagree.
- **Rejected:** monetary correction by index (needs the index catalog, package D of the Sami comparison); a per-rate calculation type (the Sami keeps one per condominium); pre-filling 2 % and 1 % in the form (the user decides per condominium).

## S — Structure
| File | Change |
|---|---|
| `apps/condominiums/models/billing_rules.py` | renamed and new fields, enums, constraints, `due_month_of`, `competence_month_of`, `MAX_LATE_FEE_PERCENTAGE`, `clean()` calling the rules |
| `apps/condominiums/models/rules/billing_rules.py` (new), `models/rules/__init__.py` | `BillingRulesRules` |
| `apps/condominiums/models/late_interest_rate.py` (new), `models/querysets/late_interest_rate.py` (new), `models/__init__.py`, `models/querysets/__init__.py` | model and `in_force_on` |
| `apps/condominiums/models/unit.py`, `models/rules/unit.py`, `models/querysets/unit.py` | six fractions, one rule each, totals and the inconsistency query |
| `apps/condominiums/validators.py`, `errors/billing_rules.py`, `errors/late_interest_rate.py` (new), `errors/__init__.py` | validators and codes |
| `apps/condominiums/serializers/late_interest_rate_serializers.py` (new), `serializers/unit_serializers.py`, `serializers/__init__.py` | serializer; the five new unit fields; `ApportionmentSerializer` for the endpoint |
| `apps/condominiums/views/late_interest_rate_views.py` (new), `views/condominium_views.py`, `views/__init__.py`, `urls.py` | viewset, `apportionment` action, router entry |
| `apps/condominiums/admin.py`, `audit.py` | inline and audit registration |
| `apps/condominiums/migrations/0005_…`, `0006_…` | billing rules and rates; unit fractions (hand-written where the rename needs it) |
| `apps/core/views/dashboard/pending.py`, `apps/core/serializers/dashboard_serializers.py` | same call, help text updated |
| `apps/condominiums/tests/…`, `apps/core/tests/…` | tests of the plan below |
| `frontend/lib/schemas/condominium.ts`, `lib/schemas/unit.ts`, `lib/billing-example.ts` (new), `lib/error-messages.ts` | form schemas, example sentence, messages |
| `frontend/app/(dashboard)/condominiums/_components/condominium-form/BillingSection.tsx`, `InterestRatesCard.tsx` (new), `ApportionmentCard.tsx` (new), `CondominiumForm.tsx` | screens |
| `frontend/app/(dashboard)/condominiums/[id]/units/_components/unit-form/` | fractions section |
| `frontend/lib/api/generated/` | regenerated, never edited |
| `docs/apps/condominiums.md`, `docs/architecture/data.md`, `docs/roadmap/phase-4-billing-generation/…`, frontend `docs/entities/domain-model.md` | docs |
Endpoints:
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET, POST | `/api/late-interest-rates/` | `condominium`, `start_date`, `monthly_percentage` | the rate (`id`, same fields, timestamps) | list filtered by `?condominium=<id>`, newest start first |
| GET, PATCH, PUT, DELETE | `/api/late-interest-rates/{id}/` | same fields | the rate | company-scoped |
| GET | `/api/condominiums/{id}/apportionment/` | - | `{active_units, fractions: [{number, total, is_inconsistent}] × 6}` | company-scoped, read-only |
| PATCH/POST | `/api/condominiums/…`, `/api/units/…` | `billing_rules` with the new fields; the five fraction fields | as today plus the new fields | `calculation_period` is gone, `due_month` replaces it |

## O — Operations
1. Migration `0005`: `AlterField` pinning `db_column`, `RenameField` (no SQL), new `BillingRules` columns with `db_default`, their checks, the `LateInterestRate` table; `0006`: the five `Unit` columns and checks. Tests of the defaults on existing rows (`MigrationExecutor`) and of the unchanged column.
2. Enums, validators, error codes, `BillingRulesRules`, model methods and tests.
3. `LateInterestRate`: model, queryset, serializer, viewset, router, admin, audit, tests.
4. Fractions: model fields, `UnitRules`, `UnitQuerySet` totals and inconsistency, serializer, the `apportionment` action, dashboard text, tests.
5. Docs of the backend, then the backend PR (this spec included).
6. Frontend, in a second PR based on the first: regenerate the client (`npm run generate:api`, backend running), schemas, billing section, rates card, unit fractions, apportionment card, messages, tests and docs; close the spec into `features/history.md`.

## N — Norms
`conventions/practices.md` §2 (rules in models; a Rules class from two rules; each rule also a constraint), §3b (no new service: `update_condominium` is untouched), `architecture/api.md` (flat resources, `@action` for a read-only aggregate), `conventions/naming.md` (booleans `should_…`, rule methods named as the violation), error codes with the registry and the frontend translation. Migrations stay backward compatible for one deploy (`architecture/operations.md`, "Migrations in production").

## S — Safeguards
- **Backward compatibility:** every new column is nullable or has a `db_default`, the renamed attribute keeps its column, the five fractions are nullable: an old container keeps reading and writing both tables while the new one starts. A client still sending `calculation_period` has it ignored by DRF until the new frontend is served; both containers are replaced in the same deploy.
- **Money settings:** `BillingRules` is already audited; `LateInterestRate` is registered in the audit log (percentages and dates are not personal data).
- **Integrity:** the 2 % limit, the all-or-none tier, the unique start date and the percentage ranges are check or unique constraints, not only serializer checks. The sum caps keep the accepted risk of two simultaneous writes (gap #21).
- **Existing data:** only demo data exists today; the defaults make a condominium behave as before (nothing is charged for lateness until a user sets it).
- **Performance:** the apportionment answer is one aggregate over the condominium's active units; the pendency query adds five `Sum`s to a query that already groups by condominium.
- **Changing the 2 % limit later** needs a migration (the constraint), by design.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/condominiums/tests/test_late_payment_migrations.py::test_existing_billing_rules_get_the_defaults`, `::test_due_month_keeps_the_old_column` |
| R2 | `apps/condominiums/tests/test_billing_rules.py::test_late_fee_out_of_range_is_invalid`, `::test_late_fee_in_range_is_valid`, `::TestBillingRulesConstraints::test_database_rejects_late_fee_above_2` |
| R3 | `apps/condominiums/tests/test_billing_rules.py::test_first_days_tier_needs_percentage_and_days`, `::test_first_days_must_be_at_least_one`, `::TestBillingRulesConstraints::test_database_rejects_a_half_filled_first_days_tier` |
| R4 | `apps/condominiums/tests/test_billing_rules.py::test_unknown_choices_are_invalid` |
| R5 | `apps/condominiums/tests/test_model_methods.py::TestBillingMonths::test_due_month_and_competence_month_of_a_reference_month` |
| R6 | `apps/condominiums/tests/test_late_interest_rate.py::test_crud_flow`, `::test_list_is_filtered_by_condominium_and_newest_start_first`, `::test_another_companys_data_is_not_reachable` |
| R7 | `apps/condominiums/tests/test_late_interest_rate.py::test_duplicate_start_date_is_rejected_with_its_code`, `::test_percentage_out_of_range_is_rejected`, `::test_database_rejects_a_duplicate_start_date` |
| R8 | `apps/condominiums/tests/test_late_interest_rate.py::test_in_force_on_picks_the_latest_start_not_after_the_date` |
| R9 | `apps/condominiums/tests/test_late_interest_rate.py::test_deleting_the_condominium_deletes_its_rates`, `::test_changes_are_audited` |
| R10 | `apps/condominiums/tests/test_ideal_fractions.py::test_each_fraction_accepts_a_value_in_range`, `::test_each_fraction_rejects_a_value_out_of_range`, `::test_database_rejects_a_fraction_out_of_range` |
| R11 | `apps/condominiums/tests/test_ideal_fractions.py::test_the_sum_of_each_fraction_cannot_exceed_one`, `::test_inactive_units_do_not_count` |
| R12 | `apps/condominiums/tests/test_pending_filters.py::test_inconsistent_apportionment_looks_at_the_fractions_in_use`, `apps/core/tests/dashboard/test_core_dashboard.py::test_a_partly_filled_second_fraction_is_counted_as_inconsistent` |
| R13 | `apps/condominiums/tests/test_ideal_fractions.py::test_apportionment_endpoint_reports_totals_and_inconsistency`, `::test_apportionment_endpoint_is_company_scoped` |
| R14 | `frontend/tests/billing-example.test.mjs::*` (the table of the four combinations); the form itself is checked in the browser (this repo has no component tests: recorded as a gap, not omitted) |
| R15 | checked in the browser (same gap as R14) |
| R16 | `npx tsc --noEmit` and `npm run build` after the client regeneration |
| R17 | `python backend/docs/tools/check_docs.py` |

Layers: model and constraint, serializer validation, API (create, update, list, filters, scoping, errors), migration, dashboard.

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`npm run generate:api`)
- [ ] `docs/apps/condominiums.md` updated; `docs/known-gaps.md` row closed (if any: N/A, none applies)
- [ ] Roadmap part and phase table updated (N/A — Roadmap is `none`; the phase 4 Notes and part 02 point here); index in `features/README.md` updated
