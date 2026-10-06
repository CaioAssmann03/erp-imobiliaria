---
summary: Naming rules (Clean Code) for classes, methods, parameters, variables, booleans, dates, tests, services and error codes, with this project's vocabulary.
read-when: you name anything (class, method, parameter, variable, test, service, error code), or review names in a change
skip-if: you need file/URL/constraint naming only → conventions/practices.md §1; you need the business vocabulary → architecture/overview.md
---
# Naming — Clean Code rules for this project

Names are the main documentation (*Clean Code*, ch. 2 and 3). Language: English. When in doubt, choose the longer name that needs no comment.

## 1. Use intention-revealing names
The name says **why it exists, what it does, how it is used**. If a comment is needed to explain a name, rename it.

| Bad | Good | Why |
|---|---|---|
| `current(on)` | `current(reference_date)` | "on what?" → the date the question is asked for |
| `d`, `p`, `m`, `t`, `n` | `digit`, `person`, `month_key`, `entry` | one-letter names cannot be searched or read |
| `data`, `info`, `obj`, `value`, `result` | `search_results`, `adjustment`, `due_day` | say what it holds, not that it holds something |
| `pct`, `rng` | `percentage`, `random_generator` | no abbreviations |
| `limit` (alone) | `apportionment_limit` | which limit? |

## 2. Avoid disinformation
A name must not lie about its type or content: `inconsistent_apportionment_condominiums()` returned **ids** → `..._ids()`. Do not put `list`, `dict`, `map` in names; use plural nouns (`links`) or the concept (`ownership_periods`).

## 3. Make meaningful distinctions
No noise words (`data`, `info`, `Manager`, `Processor`, `Helper`, `Base`) and no number series (`unit1`, `unit2`): `first_check_digit` / `second_check_digit`, not `d1` / `d2`.

## 4. Pronounceable and searchable
You must be able to say it aloud and grep it. A single letter is allowed only as the loop variable of a tiny comprehension, and even there prefer the word (`for person in persons`). No magic numbers: the constant's name states the rule (`LEASE_DAYS_AFTER = 60`, `APPORTIONMENT_TOLERANCE`).

## 5. No encodings, no mental mapping
No Hungarian prefixes. A single leading underscore marks a private helper. Do not make the reader translate (`r` = "url without host"): use the concept.

## 6. Classes are nouns, methods are verbs
- Classes and models: domain nouns (`UnitPerson`, `OwnershipPeriod`). Avoid vague suffixes. `<Entity>Rules` and `<Entity>Error` are fine: they say what they hold.
- Methods: verbs that say the action (`next_adjustment_date()`, `build_candidate()`, `validate_due_day()`).
- **Booleans** read as a question: `is_`, `has_`, `can_`, `should_` (`is_adjustment_overdue`, `has_responsible`); never negative (`not_active`). A rule method in a `Rules` class is a question that is true when the rule is **violated** (`owner_lacks_percentage`).
- Queries return a value and change nothing; commands change state and return nothing meaningful. Do not mix both in one name.

## 7. One word per concept, no puns
| Concept | Word used here | Do not also use |
|---|---|---|
| check a value and raise | `validate_*` | `check_*`, `verify_*`, `ensure_*` |
| construct without saving | `build_*` | `make_*`, `create_*` (create saves) |
| produce a value | `generate_*` (seed data), `next_*` (domain) | `calc_*` |
| run the model's rules | `run_model_rules` | `do_validation` |
| persist | `create` / `save` (Django) | `insert`, `store` |

## 8. Problem-domain and solution-domain names
Use the **business term in English** for domain concepts (`ownership_percentage`, `apportionment`, `adjustment`; glossary in `architecture/overview.md`); computer-science terms are fine for technical code (`queryset`, `mixin`, `serializer`, `candidate`).

## 9. Context: enough, not gratuitous
Add context where it is missing (`ownership_percentage`, not `percentage`, on `UnitPerson`; `address_data`, not `data`); do not repeat what the class already says (`Unit.name`, not `Unit.unit_name`).

## 10. Parameters and variables: name by role, not by type
`reference_date`, `excluded_fields`, `existing_record`, `input_values`. Collections are plural; mappings read `x_by_y`; lists of ids end in `_ids`.

| Kind | Suffix / name | Example |
|---|---|---|
| calendar date | `*_date` | `start_date`, `reference_date` |
| timestamp | `*_at` | `created_at` |
| "as of" date a rule is evaluated for | `reference_date` (`today` only when it is literally today, in a view or command) | `current(reference_date)` |
| amounts | `*_amount`, `*_percentage`, `*_fraction`, `*_total`, `*_count` | `fee_amount` |
| durations | the unit in the name | `adjustment_period_months` |

## 11. Functions: small, one thing, few arguments
- One thing at one level of abstraction; target ≤ 20 lines. If you can extract a function whose name is not a restatement of its body, extract it.
- **≤ 3 parameters**; more → a small object (`dataclass` / `NamedTuple`: `OwnershipPeriod`, `AccountPayablePayment`). A tuple whose positions have meaning is a missing class.
- **No flag (boolean) arguments**: split into two functions. No output arguments. No hidden side effects: the name tells what changes.
- Prefer exceptions to error codes; keep `try` blocks tiny. One rule, one place (`practices.md` §2).

## 12. Tests
Names describe behavior: `test_<subject>_<condition>_<expected result>` (`test_owner_without_percentage_is_rejected`). Arrange / act / assert with named variables; one concept per test.

## 13. Framework-mandated names stay
Names fixed by Django, DRF or Python keep their name (`validate`, `validated_data`, `attrs`, `queryset`, `get_search_terms`, `__str__`). Name **your own** parameters and variables well around them.

## 14. Contracts are renamed only through a spec
API field names, URL paths, database columns, enum values, **error codes** and migration names are contracts. Improving one needs a feature spec, a migration or frontend change, and a note to the user to regenerate the client. Do not rename them as part of a "cleanup".

**Services** (`apps/<app>/services/<use_case>.py`): the file and its function share one verb-first name that says the use case (`settle_account_payable`, `create_condominium`); never `*_service`, `manage_*` or `handle_*`.

**Error codes** (`apps/<app>/errors/<entity>.py`, one `<Entity>Error` class per model; shared validators in `errors/validators.py` as `<App>ValidatorError`; members named without the model prefix: `AccountPayableError.STATUS_NOT_OPEN`) are dotted lowercase `model.field.reason` (`unit.ideal_fraction.sum_exceeds_total`): the reason says what is wrong, not who checks it. A rule over several fields is named after the rule (`administration_contract.variable_fee.requires_percentage_and_basis`); a shared validator, which does not know its field, is `<validator>.<reason>` (`cpf.invalid_length`).

## 15. Review checklist for names
- [ ] No one-letter or noise names (`data`, `value`, `obj`, `tmp`, `res`) except where §4 or §13 allows
- [ ] Every boolean reads as a question; every method starts with a verb; every class is a noun
- [ ] One word per concept (§7); no abbreviations; units and kinds in the name (§10)
- [ ] No magic numbers; no tuple with positional meaning; ≤ 3 parameters; no flag arguments
- [ ] Tests describe behavior
