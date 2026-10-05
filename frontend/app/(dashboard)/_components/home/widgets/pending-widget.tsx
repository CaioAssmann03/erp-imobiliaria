import { PendingItems } from "./PendingItems";
import type { WidgetBuilder } from "./types";

export const buildPendingWidget: WidgetBuilder = (dash) => ({
  title: "Pendências",
  description: "O que pede ação, da mais crítica para a menos",
  className: "lg:col-span-4",
  showHeader: true,
  render: (large) => <PendingItems pending={dash?.pending} large={large} />,
});
