---
summary: The `seed_demo` command and the modules that build the demo data (people, condominiums, finance).
read-when: you touch demo data, `seed_demo`, or a test that borrows a seed helper such as `generate_cnpj`
skip-if: the company, scoping or search → apps/core.md; local commands → architecture/operations.md
---
# App `seed`

Development tool, not part of the product: `python manage.py seed_demo` creates example data and `seed_demo --clear` removes it. It has no models or migrations and reads every domain app, which is why it is not in `core` (`core` depends on no domain app for this). **Never run it in production** with real data.

## What lives here
| Piece | Where | Note |
|---|---|---|
| Command | `management/commands/seed_demo.py` | arguments and the order of the steps only |
| Builders | `demo_data`, `documents`, `fakes`, `validated`, `context`, `persons`, `condominiums`, `finance` | `validated.create_validated` saves through `full_clean()` so the demo data obeys the model rules; `documents` makes valid CPF/CNPJ numbers |
| Tests | `tests/test_seed_demo.py` | creating, running twice, `--clear`, apportionment, rules |

Behavior: deterministic and idempotent; validates with `full_clean()` before every save; `--clear` removes only what it created (the finance data too, even after payments and reversals); besides condominiums, units and people it creates 4 suppliers, an entry template per demo cost center and 5 open accounts payable (4 of condominiums, 1 of the company) ready to be paid; some inconsistencies are deliberate (units without owner, wrong apportionment) so the dashboard has data

Some tests of other apps import `apps.seed.documents.generate_cnpj` / `generate_cpf` to get valid document numbers.
