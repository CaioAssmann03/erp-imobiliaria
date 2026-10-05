---
summary: Cost centers and entry templates (models only, no API yet).
read-when: you plan or build finance features
skip-if: condominium data → apps/condominiums.md; what the fields mean → architecture/data/domain-rules.md
---
# App `financeiro` (finance)

**State:** models and migration only. No serializers, views, urls or admin registrations yet. Depends on `condominiums`.

## Models
| Model | Fields | Rules |
|---|---|---|
| `CostCenter` | UUID, `condominium` (CASCADE, `related_name="cost_centers"`), `name`, `active`, timestamps | unique `(condominium, name)`; replaces the old "sub-conta" |
| `EntryTemplate` | UUID, `name`, `cost_center` (PROTECT, `related_name="entry_templates"`), `active`, `has_accumulation_history`, `accumulate_to_balance`, `is_subject_to_social_security`, `admin_fee_incidence_percentage` (0–100), timestamps | unique `(cost_center, name)`; replaces the old "histórico" |

## Used by
`core` dashboard counts active condominiums **without** cost centers ("without_cost_centers"); `seed_demo` creates three cost centers
(Fundo de Reserva, Fundo de Obras, Água e Esgoto) for most condominiums.

## Next steps (need feature specs)
Serializers/views/urls/admin for both models; entries (lançamentos) and balances; billing integration with `cobranca`. 
