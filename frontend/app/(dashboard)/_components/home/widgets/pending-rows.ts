import type { Dashboard } from "@/lib/api/generated/models";

export interface PendingRow {
  count: number;
  label: string;
  detail: string;
  href: string;
}

/** Ordem = criticidade para a cobrança: sem pagador e rateio errado quebram o boleto. */
export function pendingRows(pending: Dashboard["pending"] | undefined): PendingRow[] {
  return [
    {
      count: pending?.units_without_responsible ?? 0,
      label: "Unidades sem responsável",
      detail: "Ativas, sem proprietário ou locatário: não há a quem cobrar",
      href: "/condominiums",
    },
    {
      count: pending?.inconsistent_apportionment ?? 0,
      label: "Rateio que não fecha 100%",
      detail: "Condomínios cuja soma das frações ideais é diferente de 100%",
      href: "/condominiums",
    },
    {
      count: pending?.overdue_adjustments ?? 0,
      label: "Reajustes atrasados",
      detail: "A data do próximo reajuste já passou",
      href: "/condominiums",
    },
    {
      count: pending?.adjustments_next_30_days ?? 0,
      label: "Reajustes em 30 dias",
      detail: "Condomínios com reajuste previsto no próximo mês",
      href: "/condominiums",
    },
    {
      count: pending?.leases_ending ?? 0,
      label: "Locações terminando",
      detail: "Vínculos de locatário que terminam em até 60 dias (ou já encerraram)",
      href: "/condominiums",
    },
    {
      count: pending?.without_cost_centers ?? 0,
      label: "Sem centros de custo",
      detail: "Condomínios sem centros de custo: bloqueiam o financeiro",
      href: "/condominiums",
    },
    {
      count: pending?.billing_blocked_units ?? 0,
      label: "Lançamentos bloqueados",
      detail: "Unidades com bloqueio de lançamentos",
      href: "/condominiums",
    },
    ];
}
