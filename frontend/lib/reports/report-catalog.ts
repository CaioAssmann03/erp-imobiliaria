/** Os assuntos dos relatórios, na ordem do filtro da lista. */
export const REPORT_GROUPS = ["Financeiro", "Cobrança", "Cadastros"] as const;
export type ReportGroup = (typeof REPORT_GROUPS)[number];

export interface ReportEntry {
  title: string;
  group: ReportGroup;
  description: string;
  /** Sem endereço o relatório ainda não existe (aparece apagado, com "Em breve"). */
  href?: string;
}

/** Os relatórios do sistema, na ordem em que a lista de `/reports` e o menu de Relatórios os mostram. */
export const REPORTS: readonly ReportEntry[] = [
  { href: "/reports/delinquency", group: "Financeiro", title: "Inadimplência", description: "Boletos vencidos" },
  { href: "/reports/accountability", group: "Financeiro", title: "Prestação de contas", description: "Mês na conta corrente" },
  { group: "Cobrança", title: "Taxa de administração", description: "Cobrança da administradora" },
  { group: "Cadastros", title: "Ficha da unidade", description: "Resumo de uma unidade" },
];

export const REPORTS_URL = "/reports";

export interface ReportsFrameState {
  /** A moldura (lista de relatórios à esquerda) envolve `/reports` e cada relatório. */
  hasFrame: boolean;
  /** O endereço do relatório aberto, para marcá-lo na lista; `null` no hub. */
  openHref: string | null;
  /** No celular o hub é a lista e cada relatório é uma tela separada. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/reports` (a lista e a tela vazia) e `/reports/<relatório>`. */
export function reportsFrameState(pathname: string | null): ReportsFrameState {
  const none: ReportsFrameState = { hasFrame: false, openHref: null, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, extra] = pathname.split("/");
  if (root !== "reports" || extra !== undefined) return none;
  if (second === undefined || second === "") return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  return { ...none, hasFrame: true, openHref: `${REPORTS_URL}/${second}` };
}
