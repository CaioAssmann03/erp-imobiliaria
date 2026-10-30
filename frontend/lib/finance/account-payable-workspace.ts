export const accountsPayableUrl = () => "/finance/accounts-payable";
export const newAccountPayableUrl = () => "/finance/accounts-payable/new";
export const accountPayableUrl = (accountId: string) => `/finance/accounts-payable/${accountId}`;

/** Seções da página de uma conta em aberto (e do cadastro novo), na ordem em que aparecem; o índice da direita usa estes ids. */
export const OPEN_SECTIONS = [
  { id: "despesa", label: "Despesa" },
  { id: "conta", label: "Conta" },
] as const;

/** Uma conta paga ou cancelada só se consulta: o resumo e, se paga, os comprovantes. */
const CLOSED_SECTIONS = [{ id: "resumo", label: "Resumo" }] as const;
const PAID_SECTIONS = [...CLOSED_SECTIONS, { id: "comprovantes", label: "Comprovantes" }] as const;

/** As seções do índice da direita conforme a situação da conta (`undefined`: ainda carregando ou conta nova, que é um formulário). */
export function payableSections(status: string | undefined): readonly { id: string; label: string }[] {
  if (status === "paid") return PAID_SECTIONS;
  if (status === "cancelled") return CLOSED_SECTIONS;
  return OPEN_SECTIONS;
}

export interface AccountsPayableFrameState {
  /** A coluna da lista só envolve as telas das contas a pagar: a vazia, a conta nova e a conta aberta. */
  hasFrame: boolean;
  accountId: string | null;
  isNew: boolean;
  /** No celular a lista e a conta aberta são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/finance/accounts-payable` (a vazia), `/finance/accounts-payable/new` e `/finance/accounts-payable/[accountId]`. */
export function accountsPayableFrameState(pathname: string | null): AccountsPayableFrameState {
  const none: AccountsPayableFrameState = { hasFrame: false, accountId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "finance" || second !== "accounts-payable" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, accountId: third };
}

/** Os períodos de vencimento do filtro da lista (a lista os traduz em datas para a API). */
export const DUE_OPTIONS = [
  { value: "overdue", label: "Vencidas" },
  { value: "today", label: "Vencem hoje" },
  { value: "next_7_days", label: "Próximos 7 dias" },
  { value: "this_month", label: "Neste mês" },
];
