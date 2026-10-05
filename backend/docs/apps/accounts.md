---
summary: User model (UUID, custom), JWT login/refresh, admin; future Person link.
read-when: you touch users, login, admin users/groups or plan person login
skip-if: business people → apps/persons.md; API auth conventions → architecture/api.md; security policy → architecture/quality.md
---
# App `accounts`

**Purpose:** authentication identity only. Custom user model so it can evolve without painful migrations.

| Item | Detail |
|---|---|
| Model | `User(AbstractUser)` with UUID `id` and **`company`** (FK `core.Company`, PROTECT, required); `ordering=("username",)`; `__str__` = username; manager `UserManager` (`models/user_manager.py`) |
| Setting | `AUTH_USER_MODEL = "accounts.User"` (first migration depends on `auth`) |
| Auth endpoints | `views/auth_views.py`: `LoginView` (5/min), `RefreshView` (30/min), `LogoutView` (30/min, idempotent 204: blacklists the refresh token), all with `TrustedProxyScopedRateThrottle` (`apps/core/throttling.py`); mounted in `config/urls.py` |
| Authentication class | `authentication.py`: `AuditedJWTAuthentication` (SimpleJWT + `set_audit_actor`), the DRF default |
| Admin | `UserAdmin`, `GroupAdmin` (unfold styled; `Group` is unregistered and re-registered) |
| API | `/api/auth/login/`, `/api/auth/refresh/`, `/api/auth/logout/` (see below) |
| Tests | `tests/test_audit_actor.py` (JWT and admin actor, `User` log without secrets), `tests/test_user.py` (model, JWT login/refresh/inactive/wrong password, protected endpoint, admin pages), `tests/test_user_company.py` (company required, default company, superuser env) |

## Rules
- Only admins log in today; no roles. **Company scoping** (spec 004): every user belongs to one company and sees only its data; a superuser bypasses the scope (`apps/core/scoping.py`).
- `create_user`/`create_superuser` fill `company` with `default_company()`: `DJANGO_SUPERUSER_COMPANY` (an id or a CNPJ) if set, else the only existing company (the one migration `core.0002` seeds); with several companies it must be given (`ValueError`). `entrypoint.sh` therefore needs no new variable while there is one company.
- The business entity is `persons.Person`, **not** the user. The future link is `Person.user = OneToOneField(settings.AUTH_USER_MODEL,
  null=True, blank=True, on_delete=SET_NULL, related_name="person")` **in `persons`**, so `accounts` never depends on the domain. Not implemented.
- Use `get_user_model()` / `settings.AUTH_USER_MODEL` outside this app; tests may import `apps.accounts.models.User`.
- JWT lifetimes live in `settings.SIMPLE_JWT` (access 30 min, refresh 7 days, rotating); a used refresh token is revoked (`BLACKLIST_AFTER_ROTATION`) and logout revokes it too (`token_blacklist`). The frontend keeps the tokens in HttpOnly cookies (spec 007).

## Future
Roles/permissions (phase 7, with the portal); person login.
