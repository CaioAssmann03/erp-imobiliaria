---
summary: 18 known gaps and inconsistencies in the current code, with severity and a suggested direction.
read-when: something looks wrong or missing; before proposing cleanup or infra work
skip-if: you need how things work today → practices.md; the reason behind a choice → architecture/foundation/decisions.md
---
# Known gaps (found while documenting the current code)

Treat each as a **question for the user** before acting; most need a feature spec. Severity: H high, M medium, L low.

| # | Sev | Gap | Suggested direction |
|---|---|---|---|
| 2 | H | Authorization is only `IsAuthenticated`: no roles, no per-company scoping (any admin sees every company) | spec for permissions + queryset scoping (`architecture/structure/extending.md`) |
| 3 | M | Refresh tokens are not blacklisted on logout; frontend keeps tokens in non-HttpOnly cookies | enable `token_blacklist`; see frontend `docs/safeguards/auth-and-tokens.md` |
| 4 | M | `mypy` is configured (strict + plugins) but not enforced and reports errors (untyped `unfold` admin classes, missing annotations, e.g. `core/filters.py`) | decide scope, fix, add to CI |
| 6 | M | API error messages are English while `LANGUAGE_CODE="pt-br"` makes Django/DRF built-in messages Portuguese; the frontend maps only known English strings | decide the language policy for errors (error codes?) |
| 7 | M | `financeiro` has models but no API/admin; `cobranca`, `locacoes`, `vendas` are empty stubs with the old flat layout | feature specs per module; restructure when started |
| 8 | L | `Person` has no DB/API rule that it is *either* individual *or* legal | decide whether to enforce |
| 9 | L | `Address` cannot be cleared via the API (`address: null` is ignored) | decide semantics (delete address vs keep) |
| 13 | L | `DEFAULT_AUTO_FIELD` is `BigAutoField` while all models use UUID pks | set to a UUID-friendly default or document |
| 15 | L | No rate limiting or lockout on `/api/auth/login/`; no health endpoint; no structured logging | spec for operational hardening |
| 16 | L | `fee_floor`/`fee_ceiling` and Block CRUD exist in the API but have no UI | confirm intent with the frontend |
| 17 | L | Dashboard adjustments are computed in Python over all active contracts | fine now; move to SQL if the volume grows |
| 18 | M | HSTS and HTTPS redirect are not configured (cookies are already Secure when `DEBUG=false`; `SECRET_KEY` is now mandatory in production) | enable `SECURE_HSTS_SECONDS` / `SECURE_SSL_REDIRECT` once the domain is final (check Render's health check first) |
| 19 | L | No automated database backup/restore policy; Render free Postgres expires | backup spec before go-live |
| 20 | L | `/admin/` uses the default public path and there is no audit trail of changes | restrict/rename; audit log spec |
| 21 | L | The sum caps (`clean()` reads the DB before saving) can be passed by two simultaneous writes, and writers that bypass serializers (commands, tasks, shell) must call `full_clean()` themselves; `seed_demo` creates rows directly (it relies on the DB constraints only) | call `full_clean()` in new commands/tasks; decide for the seed |
| 22 | L | Nested serializers validate a nested object as a complete record (a partial nested PATCH must send the fields its rules depend on) | acceptable today (the UI sends full objects); document in the spec of any new nested part |
| 23 | L | API names that are vague but are contracts: `upcoming_adjustments[].index` (really the adjustment index) | rename to `adjustment_index` through a spec (backend + frontend + client regeneration), see `naming.md` §14 |
| 24 | L | Two functions remain around 30 lines (`seed_demo._create`, `_create_unit_links`), above the ~20-line target of `naming.md` §11 | split when next touched |

When a gap is closed, delete its row in the same change.
