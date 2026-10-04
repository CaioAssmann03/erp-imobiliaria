---
summary: 20 known gaps and inconsistencies in the current code, with severity and a suggested direction.
read-when: something looks wrong or missing; before proposing cleanup or infra work
skip-if: you need how things work today → practices.md; the reason behind a choice → architecture/foundation/decisions.md
---
# Known gaps (found while documenting the current code)

Treat each as a **question for the user** before acting; most need a feature spec. Severity: H high, M medium, L low.

| # | Sev | Gap | Suggested direction |
|---|---|---|---|
| 1 | H | CI runs `python manage.py test` and installs only `requirements.txt`, but tests are pytest-style (`test_*.py` functions/fixtures) | install `requirements-dev.txt`, run `pytest`; keep `check` and `makemigrations --check` |
| 2 | H | Authorization is only `IsAuthenticated`: no roles, no per-company scoping (any admin sees every company) | spec for permissions + queryset scoping (`architecture/structure/extending.md`) |
| 3 | M | Refresh tokens are not blacklisted on logout; frontend keeps tokens in non-HttpOnly cookies | enable `token_blacklist`; see frontend `docs/safeguards/auth-and-tokens.md` |
| 4 | M | `mypy` is configured (strict + plugins) but not enforced and reports errors (untyped `unfold` admin classes, missing annotations, e.g. `core/filters.py`) | decide scope, fix, add to CI |
| 5 | M | `settings.py` falls back to SQLite when `POSTGRES_DB` is unset, but the project cannot run on SQLite (trigram GIN indexes) | remove the fallback or document/guard it |
| 6 | M | API error messages are English while `LANGUAGE_CODE="pt-br"` makes Django/DRF built-in messages Portuguese; the frontend maps only known English strings | decide the language policy for errors (error codes?) |
| 7 | M | `financeiro` has models but no API/admin; `cobranca`, `locacoes`, `vendas` are empty stubs with the old flat layout | feature specs per module; restructure when started |
| 8 | L | `Person` has no DB/API rule that it is *either* individual *or* legal | decide whether to enforce |
| 9 | L | `Address` cannot be cleared via the API (`address: null` is ignored) | decide semantics (delete address vs keep) |
| 10 | L | Ideal-fraction apportionment (sum = 1 per condominium) and owner percentages (sum ≤ 100 per unit) are reported/not enforced | decide enforcement level |
| 11 | L | `EntryTemplate.cost_center` uses `related_name="cost_center"` (misleading reverse accessor) | rename before an API exists |
| 12 | L | `condominiums/models/admnistration_contract.py` has a typo in the filename | rename (update imports) |
| 13 | L | `DEFAULT_AUTO_FIELD` is `BigAutoField` while all models use UUID pks | set to a UUID-friendly default or document |
| 14 | L | Celery and beat are deployed but no task or schedule exists; `backend/celerybeat-schedule` (a runtime file) is **committed** to git | `git rm --cached` it and add to `.gitignore`; first task via spec |
| 15 | L | No rate limiting or lockout on `/api/auth/login/`; no health endpoint; no structured logging | spec for operational hardening |
| 16 | L | `fee_floor`/`fee_ceiling` and Block CRUD exist in the API but have no UI | confirm intent with the frontend |
| 17 | L | Dashboard adjustments are computed in Python over all active contracts | fine now; move to SQL if the volume grows |
| 18 | M | `SECRET_KEY` has an insecure default when the env var is missing; no HTTPS/HSTS/secure-cookie settings for production | fail fast if unset with `DEBUG=false`; add production security settings |
| 19 | L | No automated database backup/restore policy; Render free Postgres expires | backup spec before go-live |
| 20 | L | `/admin/` uses the default public path and there is no audit trail of changes | restrict/rename; audit log spec |

When a gap is closed, delete its row in the same change.
