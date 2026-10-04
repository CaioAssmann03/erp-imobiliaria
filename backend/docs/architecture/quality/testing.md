---
summary: How tests are organized, run (PostgreSQL required) and what to test at each layer.
read-when: you write, run or fix tests
skip-if: environment setup commands → architecture/operations/local-dev.md
---
# Testing

pytest + pytest-django (`pytest.ini`: `DJANGO_SETTINGS_MODULE = config.settings`, `python_files = test_*.py`). **Tests need PostgreSQL**: the trigram GIN indexes do not
exist in SQLite. Run against the compose database:

```bash
docker compose up -d db
cd backend
POSTGRES_DB=erp_imobiliaria POSTGRES_HOST=localhost venv/bin/python -m pytest apps -q   # pytest-django creates test_erp_imobiliaria
```
Also run `python manage.py check` and `python manage.py makemigrations --check --dry-run` (a model change without a migration must fail).

## Layout (per app, `tests/` package)
```
tests/__init__.py
tests/base.py        helpers: body(response), results(response), make_* factories, constants (valid CPF/CNPJ)
tests/conftest.py    fixtures: api_client (force_authenticate with accounts.User), company, condominium ...
tests/test_<topic>.py
```
`core/tests/validators/` has plain test files without `__init__` (unique basenames required there).

## What to test (and where)
| Layer | How | Example |
|---|---|---|
| DB constraints | create invalid row inside `with pytest.raises(IntegrityError), transaction.atomic()` | `test_database_rejects_fixed_without_amount` |
| Serializer rules | call `Serializer(data=...).is_valid()` or `serializer.validate(attrs)`; no DB when possible | `test_floor_cannot_exceed_ceiling` |
| Nested create/update | `serializer.save()` and assert related rows | `test_update_upserts_contract_and_billing_rules` |
| API contract | `APIClient` + `reverse("<basename>-list")`; **payloads in the exact shape the frontend sends** (including nulls) | `test_api_payloads.py` |
| Lists | pagination keys, `limit`, filters, search, 401 without token | `test_api_list.py` |
| Commands/seed | `call_command(...)`; idempotent; `--clear` | `test_core_seed_demo.py` |

## Rules
- Every rule of a feature spec has a test. A constraint is tested twice: serializer (400) and database (IntegrityError).
- `pytestmark = pytest.mark.django_db` at module level for DB tests; keep non-DB tests DB-free.
- Use valid documents (`52998224725` CPF, `11222333000181` CNPJ); invalid ones only in negative tests.
- Never depend on test order or on seeded data (the `core.0002` migration seeds one company; create what you need).
- Untyped `response.data` is accessed only through `body()`/`results()` helpers.
