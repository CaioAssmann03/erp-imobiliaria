---
summary: Custom User model, JWT login/refresh/logout, user admin.
read-when: you touch users, login, admin users/groups or plan person login
skip-if: business people → apps/persons.md; API auth conventions → architecture/api.md; security policy → architecture/quality.md
---
# App `accounts`

Authentication identity only: `User(AbstractUser)` with a UUID id and a required `company` (PROTECT); `AUTH_USER_MODEL = "accounts.User"`. Outside this app use `get_user_model()` / `settings.AUTH_USER_MODEL`.

## Rules worth knowing
- Only admins log in today, no roles. Every user belongs to one company and sees only its data; a superuser bypasses the scope (`core/scoping.py`).
- `create_user` / `create_superuser` fill `company` with `default_company()`: `DJANGO_SUPERUSER_COMPANY` (an id or a CNPJ) if set, else the only existing company (the one migration `core.0002` seeds); with several it must be given (`ValueError`).
- The business entity is `persons.Person`, not the user. The future link is `Person.user` (a 1:1 in `persons`), so `accounts` never depends on the domain.
- Login (5/min), refresh (30/min) and logout (30/min) are in `views/auth_views.py`, all with `TrustedProxyScopedRateThrottle`. Logout is idempotent (always 204) and calls the `revoke_refresh_token` service. `AuditedJWTAuthentication` (the DRF default) also tells the audit trail who acts.
- JWT lifetimes are in `settings.SIMPLE_JWT` (access 30 min, refresh 7 days, rotating). A used refresh token is revoked, and logout revokes it too (`token_blacklist`). The frontend keeps the tokens in HttpOnly cookies.

## Future
Roles and permissions (phase 7, with the portal); person login.
