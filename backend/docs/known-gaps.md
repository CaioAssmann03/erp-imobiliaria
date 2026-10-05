---
summary: Known gaps and inconsistencies in the current code, with severity, the decision taken (if any) and a suggested direction.
read-when: something looks wrong or missing; before proposing cleanup or infra work
skip-if: you need how things work today → conventions/practices.md; the reason behind a choice → architecture/overview.md
---
# Known gaps (found while documenting the current code)

Treat each as a **question for the user** before acting; most need a feature spec. Severity: H high, M medium, L low.

| # | Sev | Gap | Suggested direction |
|---|---|---|---|
| 8 | L | `Person` has no DB/API rule that it is *either* individual *or* legal | **Decided:** at most one of the two, enforced in `PeopleIndividual.clean()` / `PeopleLegal.clean()` (400 in the API); a person with neither stays allowed. Lite spec |
| 9 | L | `Address` cannot be cleared via the API (`address: null` is ignored) | **Decided:** `address: null` unlinks and deletes the `Address` row (it is 1:1 and owned by the condominium); an omitted field changes nothing. Lite spec, no schema or client change |
| 15 | L | No structured logging | JSON logs with a request id and no personal data, before go-live (the health endpoint and the login rate limit are done: specs 008 and 007) |
| 16 | L | `fee_floor`/`fee_ceiling` and Block CRUD exist in the API but have no UI | **Decided:** Block screen (lite frontend spec) together with the unit registry screen, no API change; `fee_floor`/`fee_ceiling` stay `Stored` and get their screen in the spec that implements the variable fee |
| 19 | L | No automated database backup/restore policy; Render free Postgres expires | **Deferred by the user (2026-10-05):** policy left out for now, to be decided before real data enters; the database moved to Supabase, so the Render-free-Postgres-expires part no longer applies (check Supabase's plan/backups when deciding) |
| 21 | L | The sum caps (`clean()` reads the DB before saving) can be passed by two simultaneous writes | **Accepted risk** (few admin writers); revisit with bulk import or a writing portal. Writers outside the serializers call `full_clean()` (`conventions/practices.md`); `seed_demo` does since phase 3a part 04 |
| 25 | L | django-unfold (latest 0.108) triggers `RemovedInDjango70Warning` (`get_action_choices` signature); silenced in `pytest.ini` | **Decided:** keep the filter and read the unfold changelog on every dependency upgrade; upgrade unfold when a fixed release exists, before moving to Django 7.0, then drop the filter |
| 26 | L | The Django Admin login (`/admin/login/`) has no rate limit or lockout; the login throttle of spec 007 covers only `/api/auth/*` | decide later (e.g. `django-axes` or restrict the admin by network); found while writing spec 007 (roadmap: phase 3a part 08) |

When a gap is closed, delete its row in the same change.
| 27 | L | Deleting a record that `PROTECT` forbids (a condominium with cost centers that have templates or with bank accounts or accounts payable, a supplier with accounts payable, a person with links or that is a supplier...) answers 500: only `CostCenter` has a model delete rule so far | give each such delete a model rule with a code (as `CostCenter.delete()` does, spec 009) or map `ProtectedError` to a 400 in `api_exception_handler`; found while writing spec 009 |
