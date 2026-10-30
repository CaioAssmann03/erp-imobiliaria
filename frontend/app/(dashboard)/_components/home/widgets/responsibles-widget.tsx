import { ResponsiblesFocus } from "./focus/ResponsiblesFocus";
import type { WidgetBuilder } from "./types";

/** Fora da grade do painel: aparece em destaque (`?focus=responsibles`) e na busca. No painel, "Unidades sem responsável" é uma pendência. */
export const buildResponsiblesWidget: WidgetBuilder = (dash) => ({
  title: "Unidades com responsável",
  description: "Unidades ativas com proprietário ou locatário vinculado.",
  className: "lg:col-span-4",
  showHeader: true,
  render: () => <ResponsiblesFocus stats={dash?.responsibles} />,
});
