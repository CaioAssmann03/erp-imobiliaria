import type { Dashboard } from "@/lib/api/generated/models";

/** Ordem de exibição no painel: resumo, contas a pagar e pendências em destaque, depois os gráficos. */
export const WIDGET_IDS = [
  "condominiums",
  "accounts-payable",
  "pending",
  "adjustments",
  "responsibles",
  "fixed-revenue",
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export interface Widget {
  title: string;
  description?: string;
  /** Classes de grade do card no painel. */
  className: string;
  /** Mostra o título/descrição no cabeçalho do card (o modal sempre mostra). */
  showHeader: boolean;
  /** Link "Ver todos" exibido ao passar o mouse no card. */
  seeAll?: { href: string };
  /** `large` = versão ampliada exibida no modal de foco. */
  render: (large: boolean) => React.ReactNode;
}

/** Cada widget recebe o resumo do painel (ou `undefined` se a API falhou) e devolve sua definição. */
export type WidgetBuilder = (dash: Dashboard | undefined) => Widget;
