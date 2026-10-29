import { CondominiumsFocus } from "./focus/CondominiumsFocus";
import type { WidgetBuilder } from "./types";

/** Não é um card da grade: o resumo está no cabeçalho do painel (`RegistrySummary`); este widget só é a visão em destaque (Spotlight, `?focus=condominiums`). */
export const buildCondominiumsWidget: WidgetBuilder = (dash) => ({
  title: "Resumo dos cadastros",
  className: "lg:col-span-12",
  showHeader: false,
  render: () => <CondominiumsFocus dash={dash} />,
});
