---
summary: Where the work stopped on 2026-10-26 — branches and PRs, specs in flight, decisions awaiting the user, what to do next and how to run it.
read-when: you start a session and need to know what exists, what is unmerged, what is waiting on the user, or where to pick up
skip-if: the status of every phase → roadmap/README.md; the business reasons → architecture/business-model.md; a single spec → features/NNN-*.md
---
# Current state (2026-10-26)

Read first: [`architecture/business-model.md`](../architecture/business-model.md) (how the administradora works). The user works in Portuguese; code and docs are English.

## Branches (nothing was merged into `main`; the user asked for branches only)
| Branch | What it holds | State |
|---|---|---|
| `main` | phases 1–4 done, phase 5 coded (sub-account design) | untouched by these sessions |
| `claude/project-status-6vp4iv` | spec 037 as a draft only (docs) | superseded by the two below |
| `feat/single-gateway-account` | **spec 037 implemented** (one Asaas account per company, `setup_gateway_account`, migrations `billing.0011–0012`), spec 038 draft; **PR #29, draft** | tests green; sandbox validation pending |
| `feat/billing-entries` | everything above **plus spec 039 implemented** (events, launches, *Inclusão de valores* screen, sub-conta `code`) | tests green; no PR yet |

`feat/billing-entries` is built on top of `feat/single-gateway-account`: merge them in that order (037 first). Both change `issue_condominium_billing`.

## Specs
| Spec | State | Waiting on |
|---|---|---|
| 030 | `dropped` (sub-account per condominium) | — |
| 037 single gateway account | `in-progress`, implemented | sandbox validation with the CPF account (key, webhook, a charge, a confirmed payment, postings in three sub-contas); Asaas confirmation that the use is allowed; the user's OK on 2 decisions marked *agent, to be confirmed* |
| 038 registration fee | `draft` | the user's answers to its open questions (where the administradora's credit lives — recommended: a company ledger `CompanyEntry`; where the amount is defined; whether the R$ 1.20 cost shows; discount/interest on the fee; PDF line; reissue) |
| 039 billing entries | `in-progress`, implemented (backend + frontend) | the user's OK on 3 decisions marked *agent, to be confirmed*; use on real data |

## What the user decided (all recorded in the specs' *Decisions*)
Launches complement the plans; rateio individual/coletivo/fração; events are an independent catalog; Normal boleto only; no negative values yet; "Definir por %", "Arredondar", "Lançar em lote" left out until explained; a launch used by a document is frozen (only ended); the webhook is registered by our command (`setup_gateway_account --register-webhook`) with the Asaas panel as the alternative; the user wants to be **taught how the webhook works before using it** (see `architecture/operations.md` → *Gateway account (Asaas)*); the fee is never credited to a condominium.

## Known deviations to confirm with the user
- **Sub-conta scope:** the user answered "recommended" to a company-wide sub-conta catalog with a code. It would rewrite `CostCenter` ownership across ~55 files and merge existing data by name, so spec 039 only added a per-condominium `code`. The catalog needs its own spec.
- **Settings tab:** the Configurações dialog only holds appearance; "Eventos e subcontas" is a **Cadastros** section with two links (to `/billing/events` and `/condominiums/cost-centers`), not a data tab.

## Next steps, in order
1. Merge or review PR #29 (037); open a PR for `feat/billing-entries` against it or after it.
2. The user answers spec 038's questions → write its Approach/Test plan → implement (company ledger entry for the fee, the fee line on the boleto).
3. Sandbox validation (needs the user's Asaas sandbox key and a tunnel for the webhook).
4. Ask Asaas whether collecting on the administradora's own CPF account is allowed.
5. Follow-ups, each its own spec: company-wide sub-conta catalog; Extra boleto; discounts (negative values); the three unexplained launch options.
6. Before real data: database backup (`known-gaps.md` #19), structured logs (#15).

## How to run it (from a fresh clone)
Backend: Python 3.13 venv, `pip install -r backend/requirements-dev.txt`, PostgreSQL 16 (the tests need it: trigram indexes; WeasyPrint needs Pango). From `backend/` with `POSTGRES_PASSWORD`/`POSTGRES_USER` set: `pytest apps -q` (1160+ tests), `mypy apps config`, `python manage.py makemigrations --check --dry-run`, `python docs/tools/check_docs.py`. Frontend: `pnpm install`, with the backend running `pnpm generate:api`, then `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm test`, `pnpm build`. `architecture/operations.md` has the compose commands and the production runbook.
