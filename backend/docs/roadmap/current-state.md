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
| `feat/single-gateway-account` | **spec 037 implemented** (one Asaas account per company, `setup_gateway_account`, migrations `billing.0011–0012`), the spec 038 draft; **PR #29, draft** | tests green; sandbox validation pending |
| `feat/database-backup` | **spec 040**: the nightly encrypted database backup to a private R2 bucket (`deploy/vps/backup/`, runbook in `architecture/operations.md`); branched from `main` on purpose, so it can be deployed without waiting for the two PRs above | tests green; **not enabled on the VPS yet**: until it is and one restore drill is done, **real data must not enter the production database** (gap #19) |
| `feat/billing-entries` | everything above **plus spec 039 implemented** (events, launches, *Inclusão de valores* screen, sub-conta `code`) **and spec 038 implemented** (the registration fee, `CompanyEntry`, *Conta da imobiliária*, events on plan items); **PR #30, draft** (base: `feat/single-gateway-account`) | tests green |

`feat/billing-entries` is built on top of `feat/single-gateway-account`: merge them in that order (037 first). Both change `issue_condominium_billing`.

## `dev` (the branch the user tests locally)
All the feature branches above are merged into `dev`, with commits authored as the user (no Claude trailers). **Spec 041** (new app shell and condominium registry, layout 2) is built on `dev`: the narrow rail with the module menu card, the condominium page as one scrolling page with a section index, Blocos and Sub-contas moved inside it. It reads the existing appearance tokens, so mode, accent and font from *Configurações* keep working. Not in it yet (no backend data): síndico, dados bancários, documents, history and the KPI cards of the prototype. Waiting on the user: use on the real screens and the 2 decisions marked *agent, to be confirmed* in the spec.

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
- **Settings tab:** the Configurações dialog only holds appearance; "Eventos e subcontas" is a **Cadastros** section with two links (to `/billing/events` and `/condominiums/cost-centers`), not a data tab.

## Next steps, in order
0. **Backup first** (branch `feat/database-backup`, spec 040): merge it, create the private R2 bucket and the passphrase, deploy, `run-once`, restore drill. Asaas is postponed by the user (2026-10-27): the other business rules come first. To try a boleto with real data: after the backup, in production register condominium, units, people, sub-contas and plan, the events (0052 CONDOMINIO; 0005 TARIFA BANCO marked as the administradora's), launches, then *Emitir mês* (without the gateway the documents stay issued as drafts) and *Baixar PDF (RASCUNHO). The code for this lives on the unmerged branches above: merge and deploy them first.
1. Merge or review PR #29 (037); open a PR for `feat/billing-entries` against it or after it.
2. Use the fee on real data: launch the event 0005 on a condominium, issue the month and check the boleto PDF.
3. Sandbox validation (needs the user's Asaas sandbox key and a tunnel for the webhook).
4. Ask Asaas whether collecting on the administradora's own CPF account is allowed.
5. Follow-ups, each its own spec: company-wide sub-conta catalog; Extra boleto; discounts (negative values); the administradora's cash desk (payment at the counter without the fee) and the reversal of a company entry on a refund.
6. Before real data: database backup (`known-gaps.md` #19), structured logs (#15).

## How to run it (from a fresh clone)
Backend: Python 3.13 venv, `pip install -r backend/requirements-dev.txt`, PostgreSQL 16 (the tests need it: trigram indexes; WeasyPrint needs Pango). From `backend/` with `POSTGRES_PASSWORD`/`POSTGRES_USER` set: `pytest apps -q` (1160+ tests), `mypy apps config`, `python manage.py makemigrations --check --dry-run`, `python docs/tools/check_docs.py`. Frontend: `pnpm install`, with the backend running `pnpm generate:api`, then `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm test`, `pnpm build`. `architecture/operations.md` has the compose commands and the production runbook.
