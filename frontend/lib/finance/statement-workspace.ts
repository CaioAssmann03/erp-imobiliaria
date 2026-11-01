import { registryFrame } from "../navigation/registry-frame.ts";

export const statementUrl = (condominiumId?: string) => (condominiumId ? `/finance/statement/${condominiumId}` : "/finance/statement");

/** Seções do extrato de um condomínio, na ordem em que aparecem; o índice da direita usa estes ids. */
export const STATEMENT_SECTIONS = [
  { id: "saldo", label: "Saldo" },
  { id: "subcontas", label: "Sub-contas" },
  { id: "lancamentos", label: "Lançamentos" },
] as const;

export interface StatementFrameState {
  /** A coluna da lista só envolve as telas do extrato: a vazia e o extrato de um condomínio. */
  hasFrame: boolean;
  condominiumId: string | null;
  /** No celular a lista e o extrato aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/finance/statement` (a vazia) e `/finance/statement/[condominiumId]`. */
export function statementFrameState(pathname: string | null): StatementFrameState {
  const { hasFrame, id, showListOnPhone, showPageOnPhone } = registryFrame(pathname, "finance", "statement", false);
  return { hasFrame, condominiumId: id, showListOnPhone, showPageOnPhone };
}
