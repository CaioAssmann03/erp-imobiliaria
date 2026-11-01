import { FixedRevenueBody } from "@/app/(dashboard)/_components/home/bodies/FixedRevenueBody";

import { FixedRevenueFocus } from "./focus/FixedRevenueFocus";
import type { WidgetBuilder } from "./types";

export const buildFixedRevenueWidget: WidgetBuilder = (dash) => ({
  title: "Receita mensal da administradora",
  description: "Taxa de administração dos condomínios com valor fixo",
  className: "lg:col-span-4",
  showHeader: true,
  seeAll: { href: "/condominiums" },
  renderFocus: () => <FixedRevenueFocus dash={dash} />,
  render: () => <FixedRevenueBody revenue={dash?.fixed_revenue} />,
});
