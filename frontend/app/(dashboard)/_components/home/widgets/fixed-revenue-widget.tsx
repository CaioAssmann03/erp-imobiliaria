import { FixedRevenueFocus } from "./focus/FixedRevenueFocus";
import type { WidgetBuilder } from "./types";

/** Fora da grade do painel: aparece em destaque (`?focus=fixed-revenue`) e na busca. */
export const buildFixedRevenueWidget: WidgetBuilder = (dash) => ({
  title: "Receita fixa mensal",
  description: "Taxa de administração dos condomínios com valor fixo",
  className: "lg:col-span-4",
  showHeader: true,
  render: () => <FixedRevenueFocus dash={dash} />,
});
