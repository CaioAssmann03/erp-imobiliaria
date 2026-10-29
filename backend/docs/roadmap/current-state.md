---
summary: Where the work stopped on 2026-10-28 — branches and PRs, specs in flight, decisions awaiting the user, what to do next and how to run it.
read-when: you start a session and need to know what exists, what is unmerged, what is waiting on the user, or where to pick up
skip-if: the status of every phase → roadmap/README.md; the business reasons → architecture/business-model.md; a single spec → features/NNN-*.md
---
# Current state (2026-10-28)

Read first: [`architecture/business-model.md`](../architecture/business-model.md) (how the administradora works). The user works in Portuguese; code and docs are English.

## Branches
| Branch | What it holds | State |
|---|---|---|
| `main` | phases 1–4, phase 5 coded, **and the PR #31 merge** (the persons/core/billing refactor, specs 037–040 implemented: one Asaas account per company, the registration fee, *Inclusão de valores*, the backup tool in `backup/`), the landing page and the dashboard at `/dashboard` | up to date |
| `dev` | `main` + **specs 049 and 050** (the app shell and condominium registry, the unit workspace), done and in `main` since 2026-10-29; the branch the user tests locally | in sync with `main` |
| older `feat/*`, `refactor/*`, `chore/*`, `fix/*` | already in `main` (or superseded) | can be deleted |

## `dev` (the branch the user tests locally)
Specs 049 and 050 are condensed in [`features/history.md`](../features/history.md): the rail with the module menu, the condominium page as one scrolling page, and the unit workspace. Not built (no backend data): síndico, dados bancários, documents, history and the KPI cards of the prototype; the prints' extra unit sections.

## Specs
| Spec | State | Waiting on |
|---|---|---|
| 030 | `dropped` (sub-account per condominium) | — |
| 037 single gateway account | `in-progress`, implemented | sandbox validation with the CPF account (key, webhook, a charge, a confirmed payment, postings in three sub-contas); Asaas confirmation that the use is allowed; the user's OK on 2 decisions marked *agent, to be confirmed* |
| 038 registration fee | `in-progress`, implemented (backend + frontend) | the user's use on real data; the PDF discount sentence checked by eye; the payment at the administradora's counter (*caixa*) and the reversal of a company entry on a refund are left for later |
| 039 billing entries | `in-progress`, implemented (backend + frontend) | the user's OK on 3 decisions marked *agent, to be confirmed*; use on real data |

## What the user decided (all recorded in the specs' *Decisions*)
Launches complement the plans; rateio individual/coletivo/fração; events are an independent catalog; Normal boleto only; no negative values yet; "Definir por %", "Arredondar", "Lançar em lote" left out until explained; a launch used by a document is frozen (only ended); the webhook is registered by our command (`setup_gateway_account --register-webhook`) with the Asaas panel as the alternative; the user wants to be **taught how the webhook works before using it** (see `architecture/operations.md` → *Gateway account (Asaas)*); the fee is never credited to a condominium: it is a launch with an event marked "receita da imobiliária" (no sub-conta), credited to the administradora's own ledger (`CompanyEntry`, Financeiro → Conta da imobiliária); no discount on it, but multa and interest include it; a second copy charges it once; the R$ 1.20 cost is not shown; the payment at the counter is left for later; "Definir por %" and "Arredondar" are dropped and "Lançar em lote" is not needed for now.

## Known deviations to confirm with the user
- **Sub-conta scope:** the user answered "recommended" to a company-wide sub-conta catalog with a code. It would rewrite `CostCenter` ownership across ~55 files and merge existing data by name, so spec 039 only added a per-condominium `code`. The catalog needs its own spec.
- **Settings tab:** the Configurações dialog only holds appearance; "Eventos e subcontas" is a **Cadastros** section with one link (`/billing/events`; the sub-contas live inside each condominium's page, spec 049), not a data tab.

## Next steps, in order
0. **Backup first** (`backup/`, spec 040, already in `main`): create the private R2 bucket and the passphrase, deploy, `run-once`, restore drill. Asaas is postponed by the user (2026-10-27): the other business rules come first. To try a boleto with real data: after the backup, in production register condominium, units, people, sub-contas and plan, the events (0052 CONDOMINIO; 0005 TARIFA BANCO marked as the administradora's), launches, then *Emitir mês* (without the gateway the documents stay issued as drafts) and *Baixar PDF (RASCUNHO). The code for this lives on the unmerged branches above: merge and deploy them first.
1. Test `dev` on the real screens, then open the PR `dev` → `main` when the user asks.
2. Use the fee on real data: launch the event 0005 on a condominium, issue the month and check the boleto PDF.
3. Sandbox validation (needs the user's Asaas sandbox key and a tunnel for the webhook).
4. Ask Asaas whether collecting on the administradora's own CPF account is allowed.
5. Follow-ups, each its own spec: company-wide sub-conta catalog; Extra boleto; discounts (negative values); the administradora's cash desk (payment at the counter without the fee) and the reversal of a company entry on a refund.
6. Before real data: database backup (`known-gaps.md` #19), structured logs (#15).

## How to run it (from a fresh clone)
Backend: Python 3.13 venv, `pip install -r backend/requirements-dev.txt`, PostgreSQL 16 (the tests need it: trigram indexes; WeasyPrint needs Pango). From `backend/` with `POSTGRES_PASSWORD`/`POSTGRES_USER` set: `pytest apps -q` (1160+ tests), `mypy apps config`, `python manage.py makemigrations --check --dry-run`, `python docs/tools/check_docs.py`. Frontend: `pnpm install`, with the backend running `pnpm generate:api`, then `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm test`, `pnpm build`. `architecture/operations.md` has the compose commands and the production runbook.
