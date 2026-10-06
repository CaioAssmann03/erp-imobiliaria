---
summary: Naming rules (Clean Code, Robert C. Martin) for classes, methods, parameters, variables, booleans, dates and tests, with this project's vocabulary and examples.
read-when: you name anything (class, method, parameter, variable, test), or review names in a change
skip-if: you need file/URL/constraint naming only → conventions/practices.md §1; you need the business vocabulary → architecture/overview.md
---
# Naming — Clean Code rules for this project

Names are the main documentation. Follow *Clean Code* (Robert C. Martin, ch. 2 "Meaningful Names", ch. 3 "Functions"). Language: English (see `conventions/practices.md` §1).
When in doubt, choose the longer name that needs no comment.

## 1. Use intention-revealing names
The name says **why it exists, what it does, how it is used**. If a comment is needed to explain a name, rename it.

| Bad | Good | Why |
|---|---|---|
| `current(on)` | `current(reference_date)` | "on what?" → the date the question is asked for |
| `is_adjustment_overdue(today)` | `is_adjustment_overdue(reference_date)` | callers pass any date, not only today |
| `d`, `p`, `c`, `m`, `t`, `n`, `k`, `v` | `digit`, `person`, `condominium`, `month_key`, `entry` | one-letter names cannot be searched or read |
| `data`, `info`, `item`, `obj`, `value`, `result` | `dashboard`, `search_results`, `adjustment`, `person`, `due_day`, `completed_process` | say what it holds, not that it holds something |
| `pct` | `percentage` / `ownership_percentage` | no abbreviations |
| `rng` | `random_generator` | |
| `limit` (alone) | `apportionment_limit` | which limit? |

## 2. Avoid disinformation
- A name must not lie about its type or content. `inconsistent_apportionment_condominiums()` returned **ids** → `inconsistent_apportionment_condominium_ids()`.
- Do not use `list`, `dict`, `map` in names (`account_list`); use plural nouns (`links`) or the real concept (`ownership_periods`).
- Do not use names that differ only slightly (`ideal_fraction` vs `ideal_fractions_total`) unless the difference is the point.

## 3. Make meaningful distinctions
No noise words (`data`, `info`, `the`, `manager`, `processor`, `Base`, `Helper`) and no number series (`unit1`, `unit2`). If two names are different, the difference must be in
their meaning: `first_check_digit` / `second_check_digit`, not `d1` / `d2`.

## 4. Pronounceable and searchable
- You must be able to say it aloud and grep it. Single letters are allowed **only** as the loop variable of a tiny comprehension that reads as a sentence
  (`for person in persons`, never `for p in persons`). Prefer a full word even there.
- No magic numbers: `LEASE_DAYS_AFTER = 60`, `NEXT_ADJUSTMENTS_ALERT_DAYS = 30`, `APPORTIONMENT_TOLERANCE`, `_ASCII_ZERO`. The constant name states the rule.

## 5. No encodings, no mental mapping
No Hungarian prefixes (`str_name`, `lst_links`), no member prefixes. A single leading underscore marks private helpers (`_check_digit`), nothing else. Do not make the reader translate
(`r` = "url without host"): use the concept.

## 6. Classes are nouns, methods are verbs
- Classes/models: nouns from the domain (`UnitPerson`, `OwnershipPeriod`, `ClassifiedTerm`). Avoid vague suffixes (`Manager`, `Processor`, `Data`).
- Methods: verbs or verb phrases that say the action: `next_adjustment_date()`, `build_candidate()`, `run_model_rules()`, `validate_due_day()`.
- **Booleans** read as a question: `is_`, `has_`, `can_`, `should_`: `is_adjustment_overdue`, `has_responsible`, `should_search_document`. Never negative booleans (`not_active`).
- Accessors/queries return a value and change nothing (`current(...)`, `next_adjustment_date()`); commands change state and return nothing meaningful. Do not mix both in one name
  (command-query separation).
- Querysets: filters named for the condition (`current`, `inconsistent_apportionment_condominium_ids`).

## 7. One word per concept, no puns
Pick one verb for one idea and use it everywhere:

| Concept | Word used here | Do not also use |
|---|---|---|
| check a value and raise | `validate_*` | `check_*`, `verify_*`, `ensure_*` |
| construct without saving | `build_*` | `make_*`, `create_*` (create saves) |
| produce a value from input | `generate_*` (seed data), `compute`/`next_*` (domain) | `calc_*` |
| run the model's rules | `run_model_rules` | `do_validation` |
| persist | `create` / `save` (Django) | `insert`, `store` |
Do not reuse a word for two meanings (a `add` that concatenates and another that inserts).

## 8. Problem-domain and solution-domain names
Use the **business term in English** for domain concepts (`ownership_percentage`, `apportionment`, `adjustment`, `billing_rules`; glossary in `architecture/overview.md`).
Computer-science terms are fine for technical code (`queryset`, `mixin`, `serializer`, `candidate`). Mixed names should read naturally.

## 9. Context: enough, not gratuitous
- Give context where it is missing (`ownership_percentage`, not `percentage`, on `UnitPerson`; `address_data`, not `data`).
- Do not repeat what the surrounding class/module already says: `Unit.name`, not `Unit.unit_name`; `Condominium.cnpj`, not `Condominium.condominium_cnpj`.

## 10. Parameters and variables: name by role, not by type
`reference_date`, `excluded_fields`, `existing_record`, `input_values`, `weights`, `leading_digits`. Collections are plural; mappings read `x_by_y` (`totals_by_month`); lists of ids end in `_ids`.

### Dates, time and quantities
| Kind | Suffix / name | Example |
|---|---|---|
| calendar date | `*_date` | `start_date`, `adjustment_base_date`, `reference_date` |
| timestamp | `*_at` | `created_at`, `updated_at` |
| "as of" date a rule is evaluated for | `reference_date` (use `today` only when it is literally today, in a view/command) | `current(reference_date)` |
| amounts | `*_amount`, `*_percentage`, `*_fraction`, `*_total`, `*_count` | `fee_amount`, `early_payment_discount_percentage` |
| durations | unit in the name | `adjustment_period_months`, `days_until_lease_end` |

## 11. Functions: small, one thing, few arguments
- Do one thing at one level of abstraction; if you can extract a function with a name that is not a restatement of its body, extract it. Target ≤ 20 lines.
- **≤ 3 parameters**; more → group them in a small object (`dataclass`/`NamedTuple`: `DemoCondominium`, `OwnershipPeriod`, `ClassifiedTerm`). A tuple whose positions have meaning is a missing class.
- **No flag (boolean) arguments**: split into two functions. No output arguments. No hidden side effects: the name must tell what changes.
- Prefer exceptions to error codes; keep `try` blocks tiny.
- Do not repeat yourself: one rule, one place (`conventions/practices.md` §2).

## 12. Tests
Names describe behavior: `test_<subject>_<condition>_<expected result>` → `test_owner_without_percentage_is_rejected`, `test_a_past_owner_does_not_block_a_new_one`.
Arrange/act/assert with named variables (`current_links`, not `res`). One concept per test.

## 13. Framework-mandated names stay
Names fixed by Django/DRF/Python keep their name (`validate`, `validated_data`, `attrs` in `validate()` overrides, `queryset`, `get_search_terms`, `filter_type(queryset, name, value)`,
`__str__`). Do not rename them; name **your own** parameters and variables well around them.

## 14. Contracts are renamed only through a spec
API field names, URL paths, database columns, enum values, **error codes** and migration names are contracts. Improving one (done once: the dashboard key `upcoming_adjustments[].index` became
`adjustment_index`, spec 006) needs a feature spec, a migration or frontend change, and a note to the user to regenerate the client. Do not rename them as part of a "cleanup".

**Services** (`apps/<app>/services/<use_case>.py`): the file and its function share one verb-first name that says the use case (`settle_account_payable.py` → `settle_account_payable`, `create_condominium`); never `*_service`, `manage_*` or `handle_*`. Their parameters are domain objects (`company`, the instance, a frozen dataclass for more than three values), never the request.

**Error codes** (`apps/<app>/errors/<entity>.py`, one `<Entity>Error` class per model; shared validators go in `errors/validators.py` as `<App>ValidatorError`; members are named without the model prefix: `AccountPayableError.STATUS_NOT_OPEN`) are dotted lowercase `model.field.reason` (`unit.ideal_fraction.sum_exceeds_total`; the model in snake_case, the reason says what is wrong, not who checks it). A rule that spans several fields is named after the rule (`administration_contract.variable_fee.requires_percentage_and_basis`); a shared validator, which does not know its field, is `<validator>.<reason>` (`cpf.invalid_length`).

## 15. Review checklist for names
- [ ] No one-letter or noise names (`data`, `value`, `obj`, `tmp`, `res`) except where §13 or §4 allows
- [ ] Every boolean reads as a question; every method starts with a verb; every class is a noun
- [ ] One word per concept (§7); no abbreviations; units and kinds in the name (§10)
- [ ] No magic numbers; no tuple with positional meaning; ≤ 3 parameters; no flag arguments
- [ ] Tests describe behavior
