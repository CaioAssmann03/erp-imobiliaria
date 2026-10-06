---
summary: Known gaps and inconsistencies in the current code, with severity, the decision taken (if any) and a suggested direction.
read-when: something looks wrong or missing; before proposing cleanup or infra work
skip-if: you need how things work today → conventions/practices.md; the reason behind a choice → architecture/overview.md
---
# Known gaps

Treat each as a **question for the user** before acting; most need a feature spec. Severity: H high, M medium, L low. When a gap is closed, delete its row in the same change.

| # | Sev | Gap | Suggested direction |
|---|---|---|---|
| 8 | L | `Person` has no DB/API rule that it is *either* individual *or* legal | **Decided:** at most one of the two, enforced in `PeopleIndividual.clean()` / `PeopleLegal.clean()` (400 in the API); a person with neither stays allowed. Lite spec |
| 9 | L | `Address` cannot be cleared via the API (`address: null` is ignored) | **Decided:** `address: null` unlinks and deletes the `Address` row (it is 1:1 and owned by the condominium); an omitted field changes nothing. Lite spec, no schema or client change |
| 15 | L | No structured logging | JSON logs with a request id and no personal data, before go-live |
| 16 | L | `fee_floor`/`fee_ceiling` and Block CRUD exist in the API but have no UI | **Decided:** the Block screen (lite frontend spec) together with the unit registry screen, no API change; `fee_floor`/`fee_ceiling` get their screen in the spec that implements the variable fee |
| 19 | L | No automated database backup/restore policy | **Deferred by the user (2026-10-05):** to be decided before real data enters; the database moved to Supabase (check its plan and backups then) |
| 21 | L | The sum caps (`clean()` reads the DB before saving) can be passed by two simultaneous writes | **Accepted risk** (few admin writers); revisit with bulk import or a writing portal. Writers outside the serializers call `full_clean()` |
| 25 | L | django-unfold triggers `RemovedInDjango70Warning` (`get_action_choices`); silenced in `pytest.ini` | **Decided:** read the unfold changelog on every upgrade; upgrade it before Django 7.0, then drop the filter |
| 26 | L | The Django Admin login (`/admin/login/`) has no rate limit or lockout; the login throttle covers only `/api/auth/*` | Decide later (e.g. `django-axes` or restrict the admin by network) |
| 27 | L | Deleting a record that `PROTECT` forbids (a condominium with cost centers that have templates, bank accounts or accounts payable; a supplier with accounts payable; a person with links...) answers 500: only `CostCenter` has a model delete rule | Give each such delete a model rule with a code (as `CostCenter.delete()` does) or map `ProtectedError` to a 400 in `api_exception_handler` |
| 28 | L | `UnitPerson.objects.current()` ignores `start_date`: a link that has not started yet counts as current, so a unit with only a future tenant is not "without responsible" | Decide whether a future link counts as responsible; if not, add `start_date <= reference_date` to the queryset |
| 29 | L | A batch that already has ledger entries can still change its `origin`, `cash_number` or `batch_date` (the API allows a PATCH, the entries keep pointing at it) | Decide whether those fields freeze once the batch has entries; if so, a model rule with a code (as `CurrentAccount.condominium`) |
| 30 | L | An entry is immutable only through the instance (`save()` and `delete()`); `QuerySet.update()` / `QuerySet.delete()` and raw SQL skip the guard (`PROTECT` still blocks deleting what an entry points at) | Accepted while only the services write entries; a database trigger would close it if a bulk tool appears |
