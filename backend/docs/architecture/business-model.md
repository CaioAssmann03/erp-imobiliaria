---
summary: How the administradora really works (money, boletos, ledger, fees, events) — the business model every billing spec assumes.
read-when: you design or change anything about billing, the gateway, the ledger split, fees, launches or events, or you need the why behind specs 037–039
skip-if: a table of fields → architecture/data.md; the stack and env vars → architecture/overview.md; what is done or next → roadmap/README.md
---
# Business model of the administradora

Told by the user (the owner of the administradora) on 2026-10-26, in Portuguese; kept here in English so every session reasons from the same facts.

## Money
- The administradora has **one** payment-gateway account (Asaas), in its own name. Every boleto is issued on it and **all the real money lands there**. A condominium needs **no** gateway account and **no CNPJ** (many do not have one).
- What each condominium is owed exists **only in the system**, in its current account (*conta-corrente*) and its other sub-contas (*subcontas*: fundo de reserva, fundo de obras…). The payout to the condominium's real bank account is outside the system.
- When a boleto is paid, Asaas calls our **webhook**; the system finds the boleto, marks it paid and **credits each item in the sub-conta chosen for it** in the condominium's statement. That is all the gateway is for. (Spec 037 replaced the old design of one Asaas sub-account per condominium, which needed a CNPJ parent and a KYC per síndico.)
- The production account is a **CPF** account for now (the user does not want to use the CNPJ yet). Whether Asaas accepts this use for the account holder is **not verified**: confirm with Asaas before go-live.

## What goes on a boleto
- **One boleto per unit and month.** It carries the **plan items** (the fixed monthly base) and the **launches** (*lançamentos*, the *Inclusão de valores* screen: water, a special call, a works fund…). Each item names the **sub-conta** where its money is credited, so one boleto can credit the current account and, say, the works fund.
- A launch picks: the **event** (a code + name the staff knows by heart, e.g. 250 = "Limpeza do condomínio"; independent of any sub-conta; it fills the description, with the reference month typed after it), the **rateio** (*individual*: the same value per unit; *coletivo*: one total split equally; *fração*: one total split by each unit's ideal fraction), the **recurrence** (*não repetir*, *parcelado* in n installments shown "k/n", *sempre* until ended), the **sub-conta** (default: *Conta Normal*, code 0000) and the **units**.
- The reference system also has a second boleto kind, **Extra**, and negative values (**discounts**, e.g. the síndico's unit), plus "Definir por %", "Arredondar" and "Lançar em lote": not built yet, see `features/039-billing-entries.md`.

## The registration fee (*tarifa de registro bancário*)
- The administradora **always charges a fee on the boleto** and defines its amount when it launches the charges (today R$ 3.90 per boleto). The gateway charges the administradora less (today R$ 1.20 per registration, **not shown in the system**, it is internal); the difference is the administradora's.
- On the boleto it is **its own line**: `0005-TARIFA BANCO 3,90` next to `0052-CONDOMINIO 170,00` (an example boleto: Santander, issued in the administradora's own name, with competence, due date, multa and a "pagamento na ADM sem taxa banco" line).
- **The fee must NEVER be credited to the condominium.** It is a credit of the administradora itself in the system (`CompanyEntry`, screen *Conta da imobiliária*). It is launched with an event marked "receita da imobiliária", which has no sub-conta (spec 038, implemented).
- **No discount applies to the fee**; the **multa and the interest do include it**. A second copy of a boleto charges the **same** fee, never twice.
- **Not built, left for later:** the administradora has a cash desk (*caixa*): a boleto paid at the counter costs the total **without** the fee.

## Vocabulary
*Subconta* = `CostCenter` (a sub-account of a condominium's current account, with a numeric `code`). *Evento* = `BillingEvent`. *Lançamento* = `BillingEntry`. *Histórico* = `EntryTemplate` (the ledger entry kind a posting uses; a launch picks it automatically: the sub-conta's only active one). *Baixa* = marking a boleto paid.
