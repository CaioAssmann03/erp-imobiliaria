/**
 * O que cada problema de uma execução da emissão mensal quer dizer e onde se corrige.
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

export interface ProblemTarget {
  condominiumId: string;
  /** A unidade do problema; `null` quando o problema é do condomínio inteiro. */
  unitId: string | null;
}

type FixKind = "condominium" | "plans" | "units" | "unit" | null;

const PROBLEMS: Record<string, { text: string; fix: FixKind }> = {
  no_billing_rules: { text: "O condomínio não tem regras de cobrança.", fix: "condominium" },
  no_plan_in_force: { text: "Nenhum plano de cobrança vigente neste mês.", fix: "plans" },
  inconsistent_apportionment: { text: "As frações ideais das unidades não fecham em 1.", fix: "units" },
  unit_billing_blocked: { text: "Unidade com cobrança bloqueada.", fix: "unit" },
  manager_unit_exempt: { text: "Unidade do síndico isenta da cobrança.", fix: null },
  no_current_payer: { text: "A unidade não tem proprietário atual.", fix: "unit" },
  nothing_to_bill: { text: "A unidade não tem nada a cobrar neste mês.", fix: "plans" },
  payer_without_document: {
    text: "O proprietário da unidade não tem CPF ou CNPJ, exigido para registrar o boleto.",
    fix: "unit",
  },
  gateway_account_missing: {
    text: "O condomínio não tem conta ativa no gateway: os boletos ficam emitidos, mas não registrados.",
    fix: "condominium",
  },
  document_invalid: {
    text: "O documento foi recusado: confira se as sub-contas e os modelos dos itens estão ativos.",
    fix: "plans",
  },
};

const FIX_LABELS: Record<Exclude<FixKind, null>, string> = {
  condominium: "Abrir o condomínio",
  plans: "Ver os planos",
  units: "Ver as unidades",
  unit: "Abrir a unidade",
};

/** A frase em português do problema (um código desconhecido aparece como está). */
export const describeProblem = (code: string): string => PROBLEMS[code]?.text ?? code;

/** Para onde ir corrigir; `null` quando não há o que corrigir (ou falta a unidade que o link pede). */
export function problemFix(code: string, target: ProblemTarget): { href: string; label: string } | null {
  const fix = PROBLEMS[code]?.fix ?? null;
  if (fix === null) return null;
  const { condominiumId, unitId } = target;
  const hrefs: Record<Exclude<FixKind, null>, string | null> = {
    condominium: `/condominiums/${condominiumId}`,
    plans: `/billing/plans?condominium=${condominiumId}`,
    units: `/condominiums/units?condominium=${condominiumId}`,
    unit: unitId ? `/condominiums/${condominiumId}/units/${unitId}` : null,
  };
  const href = hrefs[fix];
  return href ? { href, label: FIX_LABELS[fix] } : null;
}
