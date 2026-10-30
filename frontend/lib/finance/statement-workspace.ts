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
  const none: StatementFrameState = { hasFrame: false, condominiumId: null, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "finance" || second !== "statement" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  return { ...none, hasFrame: true, condominiumId: third };
}
