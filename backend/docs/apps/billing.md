---
summary: Billing app: billing plans (the mold of a condominium's monthly charge) and, next, billing documents and the monthly issuance.
read-when: you plan or build billing features, or touch BillingPlan or BillingPlanItem
skip-if: the late-payment rules, competence and ideal fractions it reads → apps/condominiums.md; cost centers and entry templates → apps/finance.md; the plan of the phase → roadmap/phase-4-billing-generation/README.md
---

# App `billing`

**State:** billing plans: API + Admin (spec 024 in `features/history.md`); the screen is phase 4 part 06. Billing documents, the monthly issuance and the boleto come next (phase 4 parts 03–05). Depends on `condominiums`, `finance` and `core`.

## Rules worth knowing (the fields are in `models/`; the error codes in `errors/`)
- **`BillingPlan`** (the PDF's *PlanoCobranca*): a named plan of a condominium (unique name per condominium), `active`, optional `start_month` / `end_month` (first day of a month; the end not before the start). Its `condominium` never changes after creation. `BillingPlan.objects.in_force(reference_month)` is the active plans whose months include the reference month; the monthly issuance joins the items of all of them into **one** boleto per unit.
- **`BillingPlanItem`** (*ItemPlanoCobranca*): `description`, `cost_center` and `entry_template` (both active; the cost center of the plan's condominium, the template of that cost center; `PROTECT`), `calculation_kind` and only that kind's fields: `fixed_amount` → `amount` per unit; `ideal_fraction_share` → `amount` is the condominium's total, split by `ideal_fraction_number` (1 is `Unit.ideal_fraction`, 2–6 are `ideal_fraction_2` … `_6`); `unit_registered_value` → `unit_value_field` (`gas`, `water`, `electricity`: the unit's own value), no amount. Each kind rule is in `BillingPlanItemRules` and a check constraint. `position` is the order on the boleto. A share item may name a fraction no unit has yet: the issuance checks it.
- Rounding of shares and the leftover cents are the monthly issuance's (part 04), not the plan's.

## API (`/api/`)
`billing-plans`, company-scoped: list (`?condominium=`, `?active=`, `?query=` on the name), create, retrieve, update, delete (its items go with it). A plan is written **with its `items`** (at least one), all or none (`services/create_billing_plan.py`, `update_billing_plan.py`, `replace_billing_plan_items.py`): sending `items` replaces the whole list in the given order; a PATCH without `items` keeps them. An item error is reported as `items.<n>.<field>`: the nested serializer runs the item rules without the plan, then `BillingPlanSerializer` runs them again with the plan candidate attached (the cost center's condominium). Responses carry `condominium_name` and, per item, `cost_center_name` and `entry_template_name`. Both models are audited; the Admin shows a plan with its items inline.
