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
      href: "/condominiums/units?pending=without_responsible",
    },
    {
      count: pending?.inconsistent_apportionment ?? 0,
      label: "Rateio que não fecha 100%",
      detail: "Condomínios em que alguma fração ideal em uso não soma 100%",
      href: "/condominiums?pending=inconsistent_apportionment",
    },
    {
      count: pending?.overdue_adjustments ?? 0,
      label: "Reajustes atrasados",
      detail: "A data do próximo reajuste já passou",
      href: "/condominiums?pending=overdue_adjustment",
    },
    {
      count: pending?.adjustments_next_30_days ?? 0,
      label: "Reajustes em 30 dias",
      detail: "Condomínios com reajuste previsto no próximo mês",
      href: "/condominiums?pending=upcoming_adjustment",
    },
    {
      count: pending?.leases_ending ?? 0,
      label: "Locações terminando",
      detail: "Vínculos de locatário que terminam em até 60 dias (ou já encerraram)",
      href: "/condominiums/units?pending=lease_ending",
    },
    {
      count: pending?.without_cost_centers ?? 0,
      label: "Sem centros de custo",
      detail: "Condomínios sem centros de custo: bloqueiam o financeiro",
      href: "/condominiums?pending=without_cost_centers",
    },
    {
      count: pending?.billing_blocked_units ?? 0,
      label: "Lançamentos bloqueados",
      detail: "Unidades com bloqueio de lançamentos",
      href: "/condominiums/units?pending=billing_blocked",
    },
    ];
}
