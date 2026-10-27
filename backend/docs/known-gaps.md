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
| 19 | M | The nightly backup (spec 040) is built but **not yet enabled on the VPS** | The ERP database on the VPS still has **no backup running** until the bucket, the keys and the passphrase are set and one restore drill is done (`architecture/operations.md` → *Database backup*). **Real data must not enter before that.** Delete this row once the drill is done |
| 21 | L | The sum caps (`clean()` reads the DB before saving) can be passed by two simultaneous writes | **Accepted risk** (few admin writers); revisit with bulk import or a writing portal. Writers outside the serializers call `full_clean()` |
| 25 | L | django-unfold triggers `RemovedInDjango70Warning` (`get_action_choices`); silenced in `pytest.ini` | **Decided:** read the unfold changelog on every upgrade; upgrade it before Django 7.0, then drop the filter |
| 26 | L | The Django Admin login (`/admin/login/`) has no rate limit or lockout; the login throttle covers only `/api/auth/*` | Decide later (e.g. `django-axes` or restrict the admin by network) |
| 27 | L | Deleting a record that `PROTECT` forbids (a condominium with cost centers that have templates, bank accounts or accounts payable; a supplier with accounts payable; a person with links...) answers 500: only `CostCenter` has a model delete rule | Give each such delete a model rule with a code (as `CostCenter.delete()` does) or map `ProtectedError` to a 400 in `api_exception_handler` |
| 28 | L | `UnitPerson.objects.current()` ignores `start_date`: a link that has not started yet counts as current, so a unit with only a future tenant is not "without responsible" | Decide whether a future link counts as responsible; if not, add `start_date <= reference_date` to the queryset |
| 29 | L | A batch that already has ledger entries can still change its `origin`, `cash_number` or `batch_date` (the API allows a PATCH, the entries keep pointing at it) | Decide whether those fields freeze once the batch has entries; if so, a model rule with a code (as `CurrentAccount.condominium`) |
| 30 | L | An entry is immutable only through the instance (`save()` and `delete()`); `QuerySet.update()` / `QuerySet.delete()` and raw SQL skip the guard (`PROTECT` still blocks deleting what an entry points at) | Accepted while only the services write entries; a database trigger would close it if a bulk tool appears |
| 31 | L | Receipt uploads that never finish (or a failed file delete) leave rows with `confirmed_at` empty and/or objects in the R2 bucket that no receipt points at | A periodic task that deletes unconfirmed receipts older than a day (and their objects); list the bucket against the table to find orphans. Not needed before the volume grows |
| 32 | L | The monthly issuance moves a due date from a weekend to the next Monday but ignores national holidays (`due_on_business_day`) | Decide whether to keep a holiday calendar (a table or a library) before go-live; until then a boleto can fall due on a holiday |
| 33 | L | `CondominiumBillingRules.credit_limit` is stored but nothing reads it, and its meaning is inferred from Sami | Confirm what it limits (a unit's open balance?) with the user before building on it |
| 34 | L | The draft boleto PDF shows the administrator's name as text: `Company.logo_url` is a free URL and the renderer refuses every URL (no SSRF, no slow renders) | A logo upload to the bucket (like the payment receipts) and the renderer embedding it as a data URI; a spec of its own |
| 35 | L | `condominiums_billingrules` and `condominiums_lateinterestrate` stay in the database after spec 041 (no model reads them; their foreign keys were dropped) so the previous release keeps working during the deploy; rows written there by the old code after the copy are not seen by the new one | A later release drops both tables with `RunSQL` (`DROP TABLE`) once the new release is the only one running; the `billing.0012` reverse copies back into them until then |
