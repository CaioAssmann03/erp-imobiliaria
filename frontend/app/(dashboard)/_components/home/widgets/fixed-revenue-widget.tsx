import { SimpleBarChart } from "../SimpleBarChart";
import { Caption } from "./Caption";
import { brl } from "./format";
import type { WidgetBuilder } from "./types";

export const buildFixedRevenueWidget: WidgetBuilder = (dash) => {
  const revenue = dash?.fixed_revenue;

  return {
    title: "Receita fixa mensal",
    description: "Taxa de administração dos condomínios com valor fixo",
    className: "lg:col-span-4",
    showHeader: true,
    render: (large) => (
      <>
        <div className="mb-4 flex flex-col items-start gap-1 md:flex-row md:items-end md:justify-between md:gap-4">
          <div className="text-display tabular-nums">{revenue ? brl(revenue.monthly_total) : "–"}</div>
          <Caption>
            {revenue
              ? `${revenue.fixed_condominiums} com taxa fixa · ${revenue.variable_condominiums} com taxa variável (dependem do financeiro)`
              : ""}
          </Caption>
        </div>
        <SimpleBarChart
          horizontal
          data={(revenue?.largest ?? []).map((item) => ({ label: item.name, value: Number(item.amount) }))}
          className={large ? "h-96 w-full" : "h-52 w-full"}
          format="currency"
        />
      </>
    ),
  };
};
