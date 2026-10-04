---
summary: What the product is, modules and their state, business vocabulary (PT ⇄ EN).
read-when: you need the business context or the module roadmap
skip-if: stack, env vars, deploy → architecture/foundation/overview.md; rules and formulas → architecture/data/domain-rules.md
---
# Product context

**ERP Imobiliária** for **EVE Administradora de Imóveis**: administration of condominiums, rentals, sales and finance. Internal tool,
used by staff (today only admin users log in). The reference system studied is "Sami ERP"; the new data model and rules come from that
analysis (condominium module fully modeled; boleto issuing validated against a real Santander boleto).

## Modules

| Module | App | State |
|---|---|---|
| Accounts / login | `accounts` | done (custom user, JWT) |
| Company (multi-company base), shared utilities, dashboard, search | `core` | done |
| People (individuals and legal entities) | `persons` | done (API + admin) |
| Condominiums: address, administration contract, billing rules, blocks, units, owners/tenants | `condominiums` | done (API + admin) |
| Finance: cost centers, entry templates | `financeiro` | models only (no API, no admin yet) |
| Billing (boleto/Pix via Santander API; driven by billing rules, units, owners and finance entries) | `cobranca` | not started (empty stub, no doc yet) |
| Rentals (tenancy data already exists as `UnitPerson` with role `tenant`; decide whether to extend it or reference it) | `locacoes` | not started (empty stub, no doc yet) |
| Sales | `vendas` | not started (empty stub, no doc yet) |

## Business vocabulary (English code ⇄ Portuguese business term)

| Code | Business term |
|---|---|
| Condominium, Block, Unit | Condomínio, Bloco, Unidade |
| Person, individual (CPF), legal (CNPJ) | Pessoa, física, jurídica |
| UnitPerson (`owner`, `tenant`) | Vínculo proprietário / locatário |
| AdministrationContract | Contrato de administração (taxa fixa ou variável, reajuste) |
| BillingRules | Regras de cobrança (vencimento, desconto, limite de crédito) |
| `ideal_fraction` | Fração ideal (rateio; soma 1 por condomínio) |
| CostCenter, EntryTemplate | Centro de custo (antes "sub-conta"), modelo de lançamento (antes "histórico") |
| Advisor | Assessor |

## Planned integrations
Celery + Redis for scheduled jobs; direct Santander API for boleto/Pix; hosting on Render (frontend, backend, Postgres, Redis, worker).
Roadmap order follows the modules table; each new module starts with a feature spec (`docs/features/`).
