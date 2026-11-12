import { registryFrame } from "../navigation/registry-frame.ts";

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
  const { hasFrame, id, showListOnPhone, showPageOnPhone } = registryFrame(pathname, "finance", "company-account", false);
  return { hasFrame, entryId: id, showListOnPhone, showPageOnPhone };
}
