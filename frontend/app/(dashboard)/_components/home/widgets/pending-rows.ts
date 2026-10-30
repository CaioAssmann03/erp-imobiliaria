import type { Dashboard } from "@/lib/api/generated/models";

export type Severity = "critical" | "attention" | "info";

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Críticas: impedem a cobrança ou o financeiro",
  attention: "Pedem atenção",
  info: "Para acompanhar",
};

export interface PendingRow {
  severity: Severity;
  count: number;
  label: string;
  detail: string;
  href: string;
  /** Fora do card do painel (continua na visão ampliada): o assunto já tem lista própria no painel. */
  hiddenOnPanel?: boolean;
}

/** Ordem = criticidade para a cobrança: sem pagador e rateio errado quebram o boleto. */
export function pendingRows(pending: Dashboard["pending"] | undefined): PendingRow[] {
  return [
    {
      severity: "critical",
      count: pending?.units_without_responsible ?? 0,
      label: "Unidades sem responsável",
      detail: "Ativas, sem proprietário ou locatário: não há a quem cobrar",
      href: "/condominiums/units?pending=without_responsible",
    },
    {
      severity: "critical",
      count: pending?.inconsistent_apportionment ?? 0,
      label: "Rateio que não fecha 100%",
      detail: "Condomínios em que alguma fração ideal em uso não soma 100%",
      href: "/condominiums?pending=inconsistent_apportionment",
    },
    {
      severity: "attention",
      count: pending?.overdue_adjustments ?? 0,
      label: "Reajustes atrasados",
      detail: "A data do próximo reajuste já passou",
      href: "/condominiums?pending=overdue_adjustment",
      hiddenOnPanel: true,
    },
    {
      severity: "info",
      count: pending?.adjustments_next_30_days ?? 0,
      label: "Reajustes em 30 dias",
      detail: "Condomínios com reajuste previsto no próximo mês",
      href: "/condominiums?pending=upcoming_adjustment",
      hiddenOnPanel: true,
    },
    {
      severity: "attention",
      count: pending?.leases_ending ?? 0,
      label: "Locações terminando",
      detail: "Vínculos de locatário que terminam em até 60 dias (ou já encerraram)",
      href: "/condominiums/units?pending=lease_ending",
      hiddenOnPanel: true,
    },
    {
      severity: "critical",
      count: pending?.without_cost_centers ?? 0,
      label: "Sem centros de custo",
      detail: "Condomínios sem centros de custo: bloqueiam o financeiro",
      href: "/condominiums?pending=without_cost_centers",
    },
    {
      severity: "info",
      count: pending?.billing_blocked_units ?? 0,
      label: "Lançamentos bloqueados",
      detail: "Unidades com bloqueio de lançamentos",
      href: "/condominiums/units?pending=billing_blocked",
    },
    ];
}
