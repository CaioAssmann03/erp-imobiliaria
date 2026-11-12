import { AdjustmentsFocus } from "./focus/AdjustmentsFocus";
import type { WidgetBuilder } from "./types";

/** Fora da grade do painel: aparece em destaque (`?focus=adjustments`) e na busca. A lista "Próximos reajustes" é o que está no painel. */
export const buildAdjustmentsWidget: WidgetBuilder = (dash) => ({
  title: "Reajustes",
  description: "Previstos nos próximos 6 meses",
  className: "lg:col-span-4",
  showHeader: true,
  render: () => <AdjustmentsFocus dash={dash} />,
});
