/**
 * Textos e entradas da lista de condomínios do painel (spec 038). Funções puras, sem imports do app: rodam direto no `node --test`.
 */

/** O código com quatro dígitos, como na lista da Sami ("0003"). */
export function formatCondominiumCode(code: number): string {
  return String(code).padStart(4, "0");
}

/** "1 unidade", "17 unidades". */
export function unitCountLabel(count: number): string {
  return count === 1 ? "1 unidade" : `${count} unidades`;
}

/** O rodapé da lista: "124 condomínios ativos" com os inativos ocultos, "N condomínios" com todos. */
export function condominiumTotalLabel(count: number, hidesInactive: boolean): string {
  const noun = count === 1 ? "condomínio" : "condomínios";
  if (!hidesInactive) return `${count} ${noun}`;
  return `${count} ${noun} ${count === 1 ? "ativo" : "ativos"}`;
}

/** O código digitado em "Buscar por código": só dígitos (aceita "0003"); vazio ou longo demais, nada. */
export function codeFromInput(input: string): number | null {
  const digits = input.trim();
  return /^[0-9]{1,9}$/.test(digits) ? Number(digits) : null;
}

/** As pendências do filtro (`?pending=`), as mesmas dos atalhos do painel de pendências do início. */
export const CONDOMINIUM_PENDING_OPTIONS = [
  { value: "without_cost_centers", label: "Sem sub-contas" },
  { value: "inconsistent_apportionment", label: "Rateio não fecha 100%" },
  { value: "overdue_adjustment", label: "Reajuste atrasado" },
  { value: "upcoming_adjustment", label: "Reajuste em 30 dias" },
] as const;

/** A pendência que vem do endereço (`/condominiums?pending=…`, dos atalhos do início): só vale uma das conhecidas. */
export function pendingFromParam(value: string | null | undefined): string {
  return CONDOMINIUM_PENDING_OPTIONS.some((option) => option.value === value) ? (value as string) : "";
}
