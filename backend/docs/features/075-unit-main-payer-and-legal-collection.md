---
summary: Spec 075 (draft) — each unit has one main owner and one main tenant (the boleto goes to the main one of the role chosen, in that person's CPF or CNPJ), a Cobrança jurídica part with the process number, and observation fields.
read-when: you change who receives a unit's boleto, the owner and tenant links of a unit, or the legal collection and notes fields of a unit
skip-if: the unit page layout and its sections → features/history.md (spec 050); issuing the boleto itself → apps/billing.md; the person's data → apps/persons.md
---
# 075 — Unit: main owner and tenant, legal collection and notes

**Status:** draft · **Level:** full · **Roadmap:** none · **Apps:** condominiums, billing, frontend · **Frontend impact:** client regeneration, changed screens

## Open questions
- [ ] When the **main link ends** (or is removed) and other current links of that role remain, does another one become main by itself? (recommended: no; until someone chooses, the payer keeps the rule of today, the largest share and then the earliest start, and the unit page says "Sem principal: escolha um", so a boleto never stops by surprise)
- [ ] Should the **process number** also appear in the *Ficha da unidade* report (spec 071)? (recommended: yes, one line under the unit's data)
- [ ] Does a unit in legal collection stop its boletos? (recommended: no; the unit already has "Bloquear lançamentos", which is a separate choice)
- [ ] The process number is free text up to 40 characters (recommended, the courts use more than one format) or the unified CNJ number, validated (`0000000-00.0000.0.00.0000`)?

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-27 | The unit page gets a part for **legal collection** (*cobrança jurídica*) with the **process number**, and **observation** fields | the user |
| 2026-11-27 | The owners keep the percentage of each one, but **one owner is the main one** and the boleto is issued in his or her CPF or CNPJ; **the same for the tenants**: one main tenant | the user |
| 2026-11-27 | A link has `is_primary`. Among the links of a unit with the same role and **no end date**, at most one is main (a partial unique constraint and a model rule) | agent, to be confirmed |
| 2026-11-27 | The **first** link of a role in a unit is created as the main one; a later link is created as main only if the role has none; **Tornar principal** moves it from one to another in one step | agent, to be confirmed |
| 2026-11-27 | The boleto payer is the **main link of the role** the unit sends the boleto to (`billing_recipient`); with the tenant chosen and no current tenant it falls back to the main owner, as today; with no main link the rule of today applies | agent, to be confirmed |
| 2026-11-27 | The links that exist are not left without a main one: a data migration marks, in each unit and role with current links, the one that today's rule would choose | agent, to be confirmed |
| 2026-11-27 | Three optional text fields on the unit: `legal_process_number` (up to 40), `legal_notes` and `notes`. **Observações** sits in *Dados gerais* and **Cobrança jurídica** is its own part with the process number and its observations; the notes are plain text, not a place for passwords (a hint says so) | agent, to be confirmed |

## R — Requirements
The boleto of a unit with two owners (80% and 20%) must go to the one the staff chose, not to whoever happens to have the larger share, and the same for tenants; and the unit must carry what the staff need about a legal collection.
- [ ] R1 — `UnitPerson.is_primary`: among the links of a unit and a role with no end date, at most one is main (`unit_person_single_primary_per_role`), also as a model rule with a coded error
- [ ] R2 — A link is created as main when its role has no main link in the unit; asking for a second main one is a coded 400; `POST /api/unit-people/{id}/make-primary/` makes it main and the previous one not, atomically, and is refused for an ended link
- [ ] R3 — `Unit.billing_payer(date)` returns the main link's person of the role chosen by `billing_recipient` (tenant → the main tenant, else the main owner); with no main link it keeps today's rule; the monthly issuance and the extra boleto use it unchanged
- [ ] R4 — A data migration marks as main, per unit and role with current links, the link today's rule chooses (no unit changes payer by migrating)
- [ ] R5 — The *Proprietário* and *Inquilino* parts show a **Principal** tag on the main link and **Tornar principal** on the other current ones; the add form has **Principal (recebe o boleto)**, checked when the role has none; a role with links and no main one says so
- [ ] R6 — `Unit.legal_process_number`, `Unit.legal_notes` and `Unit.notes` exist, are optional and come and go through the unit API; they are audited with the unit
- [ ] R7 — The unit page has the **Cobrança jurídica** part (process number and observations) in its menu and an **Observações** field in *Dados gerais*; nothing in them changes what is billed

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `condominiums.UnitPerson` | `is_primary` | `BooleanField(default=False)`; `UniqueConstraint(unit, role)` where `is_primary` and `end_date IS NULL` (`unit_person_single_primary_per_role`, coded message); rule in `UnitPersonRules` |
| `condominiums.Unit` | three fields | `legal_process_number` `CharField(40, blank)`, `legal_notes` `TextField(blank)`, `notes` `TextField(blank)`; `billing_payer` reads the main link |
| `condominiums.UnitPerson` serializer | `is_primary` | read and, on create, write; changed afterwards only by the action |

## A — Approach
- **The choice is data, not a calculation.** Today the payer is derived (the largest share, the earliest start); that gives the wrong person as soon as the shares are 50/50 or the staff want the other one. A flag chosen by a person replaces the derivation, and the old derivation stays only as the fallback and as the migration's rule.
- **One main link per role among the links that have no end date**, the same shape as the existing "one active link per person and role" constraint, so the database refuses two. An ended link may keep its flag as history.
- **Swapping is a service** (`make_primary_unit_person`): one transaction clears the other main link of the unit and role and sets this one; the rules stay in the model, the service only orchestrates.
- **The percentages do not change**: owners still sum to at most 100% and each owner still needs a percentage; being main says nothing about the share.
- **The notes are plain text** with a visible hint; nothing here stores secrets, and the audit log masks nothing (personal data is not in these fields).
- Rejected: the highest share as the main one by definition (the staff asked to choose); one flag on the unit pointing to a person (it would not survive the end of that link or the change of the role).

## S — Structure
Backend (`apps/condominiums/`): `models/unit_person.py`, `models/rules/unit_person.py`, `errors/`, `models/unit.py` (`billing_payer`, the three fields), `services/make_primary_unit_person.py`, `serializers/unit_person_serializers.py` and `unit_serializers.py`, `views/unit_person_views.py` (the action), `admin.py`, migrations (the fields, then the data migration of R4); `billing` calls `billing_payer` as before.
Frontend: `unit-people/UnitPeopleList.tsx`, `UnitPersonForm.tsx`, `unit-link-summary.ts`, a new `LegalCollectionSection`, `IdentificationSection` (Observações), `lib/schemas/unit.ts`, `lib/condominiums/unit-workspace.ts` (the section index), the client.

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/api/unit-people/` | `unit, person, role, ownership_percentage?, start_date, end_date?, is_primary?` | the link | a second main link of the role → 400 |
| POST | `/api/unit-people/{id}/make-primary/` | — | the link | atomic; refused for an ended link |
| PATCH | `/api/units/{id}/` | `legal_process_number?, legal_notes?, notes?` | the unit | |

## O — Operations
1. Fields and constraint (`is_primary`, the three unit fields), then the data migration of R4 (reversible: it only sets a flag).
2. Rules, coded errors, the service and the action; `billing_payer`.
3. Serializers and the API; tests; docs (`apps/condominiums.md`, `apps/billing.md` where the payer is described).
4. Client regeneration; the unit page: main tag and button, the add form, the new part, the notes field; tests; docs.

## N — Norms
Rules in the models, services orchestrate; names in English; Portuguese on the screen; the frontend does not choose the payer, it only shows and sets the flag.

## S — Safeguards
- **Money:** the payer decides who owes the boleto, so the migration must not change anyone's payer (a test compares the payer of every unit before and after) and the fallback keeps issuing when no link is main.
- **Concurrency:** two staff members making different links main at once: the partial unique constraint refuses one of them.
- **Scoping:** the action uses the company-scoped viewset; another company's link is a 404.
- **Personal data:** the notes are free text and may receive personal data; they are audited like the rest of the unit and are not exported anywhere new.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/condominiums/tests/test_unit_person_primary.py` (constraint and rule) |
| R2 | `apps/condominiums/tests/test_unit_person_primary.py` (creation, second main refused, `make-primary`, ended link refused) |
| R3 | `apps/condominiums/tests/test_unit_billing_payer.py` (the main owner and the main tenant, the fallbacks, no main) and `apps/billing/tests/` (the issuance uses it) |
| R4 | `apps/condominiums/tests/test_unit_person_primary_migration.py` (the payer is the same before and after) |
| R5 | `frontend/tests/unit-link-summary.test.mjs` (the tag and the empty-main message); the buttons driven in a browser |
| R6 | `apps/condominiums/tests/test_unit_legal_collection.py` (fields, API, audit) |
| R7 | none automated: the unit page driven in a browser (a written gap) |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean; `mypy apps config` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`); `tsc`, `eslint`, `pnpm test`, `pnpm build` clean
- [ ] `docs/apps/condominiums.md` and `docs/apps/billing.md` updated
- [ ] The unit page was driven in a browser (main owner and tenant, the legal part, the notes)
