import { DelinquencyBody } from "@/app/(dashboard)/_components/home/bodies/DelinquencyBody";
import { DelinquencyFocus } from "./focus/DelinquencyFocus";
import type { WidgetBuilder } from "./types";

export const buildDelinquencyWidget: WidgetBuilder = () => ({
  title: "Inadimplência",
  description: "Boletos vencidos e não pagos, por condomínio",
  className: "lg:col-span-4",
  showHeader: true,
  seeAll: { href: "/reports/delinquency" },
  renderFocus: () => <DelinquencyFocus />,
  render: () => <DelinquencyBody />,
});
