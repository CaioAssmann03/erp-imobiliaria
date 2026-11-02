import { registryFrame } from "../navigation/registry-frame.ts";

/** A lista das contas a pagar, com o período de vencimento (`?due=`, um dos `DUE_OPTIONS`) já escolhido, como o painel a abre; sem ele, a lista toda. */
export const accountsPayableUrl = (due = "") => (due ? `/finance/accounts-payable?due=${due}` : "/finance/accounts-payable");
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
  const { id, ...frame } = registryFrame(pathname, "finance", "accounts-payable");
  return { ...frame, accountId: id };
}

/** Os períodos de vencimento do filtro da lista (a lista os traduz em datas para a API). */
export const DUE_OPTIONS = [
  { value: "overdue", label: "Vencidas" },
  { value: "today", label: "Vencem hoje" },
  { value: "next_7_days", label: "Próximos 7 dias" },
  { value: "this_month", label: "Neste mês" },
];

/** O período lido de `?due=`: só um dos `DUE_OPTIONS` vale (o valor vira um filtro da lista). */
export const dueParam = (value: string | null): string => (DUE_OPTIONS.some((option) => option.value === value) ? (value as string) : "");
