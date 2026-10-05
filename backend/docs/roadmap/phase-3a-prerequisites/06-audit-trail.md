---
summary: Plan and status of part 06 of phase 3a — Change audit trail.
read-when: you work on change audit trail before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 06 — Change audit trail

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** core, persons, condominiums, finance · **Frontend impact:** none · **Depends on:** 05
**Spec:** [005 — Change audit trail](../../features/005-audit-trail.md)

## Goal
Know who changed which registry record and when, without touching the models. Decided in gap #20. Finance records keep their own explicit audit fields (they are part of the business rule, phase 3).

## Scope
- [x] Install and configure `django-auditlog`; capture the acting user (middleware)
- [x] Register persons, individual/legal data, condominiums, address, contract, billing rules, blocks, units, links, cost centers, entry templates
- [x] Mask personal fields in the log (CPF, CNPJ, RG, birthday, e-mail, phones)
- [x] Read-only admin view of the log; tests; update `architecture/quality.md` and `apps/core.md`

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 005 `done`). The spike passed: `django-auditlog` 3.4.1 (declared for Django up to 5.2) installs, migrates and logs on Django 6.1.1 and PostgreSQL; the full suite runs with it enabled, so a future Django upgrade that breaks it fails CI.
Delivered: `auditlog` in `INSTALLED_APPS` and its middleware; `apps/core/audit.py` (helper, `AUDIT_EXEMPT`, the full-value mask); `apps/<app>/audit.py` registered from `AppConfig.ready()` for accounts, core, persons, condominiums and finance; `AuditedJWTAuthentication` as the DRF default; the superuser-only read-only log admin; guard tests.
Findings recorded in the spec: the library's default mask keeps half of the value (replaced by `[masked]`); its middleware cannot see the JWT user (the authentication class sets the actor); the client address is not stored.
Checked: `pytest apps -q` 297 passed, `mypy apps config` clean. Migrations: the library ships its own (`auditlog.0001…`), applied by `migrate`; no project migration changed.