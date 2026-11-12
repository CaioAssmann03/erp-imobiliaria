import { BillingMonthBody } from "@/app/(dashboard)/_components/home/bodies/BillingMonthBody";
import { BillingMonthFocus } from "./focus/BillingMonthFocus";
import type { WidgetBuilder } from "./types";

export const buildBillingMonthWidget: WidgetBuilder = () => ({
  title: "Emissão do mês",
  description: "Boletos do mês corrente: emitidos, recebidos e em aberto",
  className: "lg:col-span-4",
  showHeader: true,
  seeAll: { href: "/billing/documents" },
  renderFocus: () => <BillingMonthFocus />,
  render: () => <BillingMonthBody />,
});
