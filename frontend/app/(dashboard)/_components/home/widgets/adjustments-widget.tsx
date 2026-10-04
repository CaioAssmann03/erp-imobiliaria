import { SimpleBarChart } from "../SimpleBarChart";
import { longMonthLabel, shortMonthLabel } from "./format";
import type { WidgetBuilder } from "./types";

export const buildAdjustmentsWidget: WidgetBuilder = (dash) => ({
  title: "Reajustes",
  description: "Previstos nos próximos 6 meses",
  className: "lg:col-span-3",
  showHeader: true,
  render: (large) => (
    <SimpleBarChart
      data={(dash?.adjustments_by_month ?? []).map((item) => ({
        label: shortMonthLabel(item.month),
        tooltipLabel: longMonthLabel(item.month),
        value: item.total,
      }))}
      className={large ? "h-72 w-full" : "h-40 w-full"}
      highlightFirst
    />
  ),
});
