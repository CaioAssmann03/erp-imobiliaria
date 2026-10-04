---
summary: User model (UUID, custom), JWT login/refresh, admin; future Person link.
read-when: you touch users, login, admin users/groups or plan person login
skip-if: business people → apps/persons.md; API auth conventions → architecture/api/api-conventions.md; security policy → architecture/quality/security.md
---
# App `accounts`

**Purpose:** authentication identity only. Custom user model so it can evolve without painful migrations.

| Item | Detail |
|---|---|
| Model | `User(AbstractUser)` with UUID `id`; `ordering=("username",)`; `__str__` = username |
| Setting | `AUTH_USER_MODEL = "accounts.User"` (first migration depends on `auth`) |
| Admin | `UserAdmin`, `GroupAdmin` (unfold styled; `Group` is unregistered and re-registered) |
| API | none of its own; login/refresh are SimpleJWT views mounted in `config/urls.py` (`/api/auth/login/`, `/api/auth/refresh/`) |
| Tests | `tests/test_user.py` (model, JWT login/refresh/inactive/wrong password, protected endpoint, admin pages) |

## Rules
- Only admins log in today; no roles, no per-company scoping.
- The business entity is `persons.Person`, **not** the user. The future link is `Person.user = OneToOneField(settings.AUTH_USER_MODEL,
  null=True, blank=True, on_delete=SET_NULL, related_name="person")` **in `persons`**, so `accounts` never depends on the domain. Not implemented.
- Use `get_user_model()` / `settings.AUTH_USER_MODEL` outside this app; tests may import `apps.accounts.models.User`.
- JWT lifetimes live in `settings.SIMPLE_JWT` (access 30 min, refresh 7 days, rotating). Refresh tokens are **not** blacklisted on logout
  (see known-gaps.md).

## Future
Roles/permissions and per-company scoping (feature spec needed: affects every endpoint); token blacklist; person login.
