import { BillingChartBody } from "@/app/(dashboard)/_components/home/bodies/BillingChartBody";
import { BillingChartFocus } from "./focus/BillingChartFocus";
import type { WidgetBuilder } from "./types";

export const buildBillingChartWidget: WidgetBuilder = () => ({
  title: "Boletos emitidos × recebidos",
  description: "Boletos dos últimos meses, por mês de referência",
  className: "lg:col-span-7",
  showHeader: true,
  renderFocus: () => <BillingChartFocus />,
  render: () => <BillingChartBody />,
});
