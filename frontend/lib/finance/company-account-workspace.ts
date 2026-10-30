export const companyAccountUrl = () => "/finance/company-account";
export const companyEntryUrl = (entryId: string) => `/finance/company-account/${entryId}`;

/** Seções da página de um lançamento da imobiliária; o índice da direita usa estes ids. */
export const COMPANY_ENTRY_SECTIONS = [{ id: "lancamento", label: "Lançamento" }] as const;

export interface CompanyAccountFrameState {
  /** A coluna da lista só envolve as telas da conta da imobiliária: a vazia (com o saldo) e o lançamento aberto. */
  hasFrame: boolean;
  entryId: string | null;
  /** No celular a lista e o lançamento aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/finance/company-account` (a vazia) e `/finance/company-account/[entryId]`. */
export function companyAccountFrameState(pathname: string | null): CompanyAccountFrameState {
  const none: CompanyAccountFrameState = { hasFrame: false, entryId: null, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "finance" || second !== "company-account" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  return { ...none, hasFrame: true, entryId: third };
}
