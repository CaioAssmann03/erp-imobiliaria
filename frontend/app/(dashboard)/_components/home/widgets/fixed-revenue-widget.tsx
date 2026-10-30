import { Caption } from "./Caption";
import { FixedRevenueFocus } from "./focus/FixedRevenueFocus";
import { brl } from "./format";
import type { WidgetBuilder } from "./types";

/** No painel é só o número; o gráfico por condomínio está na visão em destaque. */
export const buildFixedRevenueWidget: WidgetBuilder = (dash) => {
  const revenue = dash?.fixed_revenue;

  return {
    title: "Receita fixa mensal",
    description: "Taxa de administração dos condomínios com valor fixo",
    className: "lg:col-span-4",
    showHeader: true,
    seeAll: { href: "/dashboard?focus=fixed-revenue" },
    renderFocus: () => <FixedRevenueFocus dash={dash} />,
    render: () => (
      <>
        <div className="text-display tabular-nums">{revenue ? brl(revenue.monthly_total) : "–"}</div>
        <div className="mt-1">
          <Caption>
            {revenue ? `${revenue.fixed_condominiums} condomínios com taxa fixa · ${revenue.variable_condominiums} variável` : ""}
          </Caption>
        </div>
      </>
    ),
  };
};
