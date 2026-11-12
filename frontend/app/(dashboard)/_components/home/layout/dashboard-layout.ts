export const DEFAULT_ORDER = [
  "billing-month",
  "delinquency",
  "accounts-payable",
  "pending",
  "billing-chart",
  "fixed-revenue",
  "upcoming-adjustments",
] as const;

export type DashboardItemId = (typeof DEFAULT_ORDER)[number];

/** Cada widget tem um tamanho fixo na grade de 12 colunas: mover um widget nunca o aumenta nem o diminui. */
const WIDE: ReadonlySet<DashboardItemId> = new Set(["billing-chart", "upcoming-adjustments"]);
export const isWide = (id: DashboardItemId) => WIDE.has(id);
export const spanOf = (id: DashboardItemId) => (isWide(id) ? "md:col-span-2 lg:col-span-8" : "lg:col-span-4");

export const isItemId = (value: unknown): value is DashboardItemId => DEFAULT_ORDER.some((id) => id === value);

/** `order` tem todos os widgets, na ordem de exibição; `hidden` são os que a pessoa tirou do painel. */
export interface DashboardLayout {
  order: DashboardItemId[];
  hidden: DashboardItemId[];
}

export const DEFAULT_LAYOUT: DashboardLayout = { order: [...DEFAULT_ORDER], hidden: [] };

const VERSION = 1;

const knownIds = (value: unknown): DashboardItemId[] => (Array.isArray(value) ? [...new Set(value.filter(isItemId))] : []);

/** Lê o que ficou salvo; qualquer coisa estranha vira o padrão. Widget novo (que o salvo não conhece) entra no fim e visível. */
export function parseLayout(raw: string | null): DashboardLayout {
  if (!raw) return DEFAULT_LAYOUT;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || !("version" in data) || data.version !== VERSION) return DEFAULT_LAYOUT;
    const saved = knownIds("order" in data ? data.order : []);
    return {
      order: [...saved, ...DEFAULT_ORDER.filter((id) => !saved.includes(id))],
      hidden: knownIds("hidden" in data ? data.hidden : []),
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export const serializeLayout = (layout: DashboardLayout) => JSON.stringify({ version: VERSION, ...layout });

export const visibleItems = (layout: DashboardLayout) => layout.order.filter((id) => !layout.hidden.includes(id));

/** O widget assume o lugar do `targetId`: quem estava ali anda para o lado oposto ao do movimento. */
export function moveItem(layout: DashboardLayout, id: DashboardItemId, targetId: DashboardItemId): DashboardLayout {
  if (id === targetId) return layout;
  const order = layout.order.filter((item) => item !== id);
  order.splice(layout.order.indexOf(targetId), 0, id);
  return { ...layout, order };
}

/** Troca com o vizinho visível do lado pedido (-1 antes, 1 depois). */
export function shiftItem(layout: DashboardLayout, id: DashboardItemId, step: -1 | 1): DashboardLayout {
  const visible = visibleItems(layout);
  const neighbour = visible[visible.indexOf(id) + step];
  return neighbour ? moveItem(layout, id, neighbour) : layout;
}

export const hideItem = (layout: DashboardLayout, id: DashboardItemId): DashboardLayout =>
  layout.hidden.includes(id) ? layout : { ...layout, hidden: [...layout.hidden, id] };

/** Um widget que volta ao painel entra no fim. */
export const showItem = (layout: DashboardLayout, id: DashboardItemId): DashboardLayout => ({
  order: [...layout.order.filter((item) => item !== id), id],
  hidden: layout.hidden.filter((item) => item !== id),
});
