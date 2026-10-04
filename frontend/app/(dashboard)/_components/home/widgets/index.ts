import type { Dashboard } from "@/lib/api/generated/models";

import { buildAdjustmentsWidget } from "./adjustments-widget";
import { buildCondominiumsWidget } from "./condominiums-widget";
import { buildFixedRevenueWidget } from "./fixed-revenue-widget";
import { buildPendingWidget } from "./pending-widget";
import { buildResponsiblesWidget } from "./responsibles-widget";
import type { Widget, WidgetId } from "./types";

export { WIDGET_IDS, type Widget, type WidgetId } from "./types";

/** Definição de todos os widgets do painel a partir do resumo da API. */
export function buildWidgets(dash: Dashboard | undefined): Record<WidgetId, Widget> {
  return {
    condominiums: buildCondominiumsWidget(dash),
    responsibles: buildResponsiblesWidget(dash),
    adjustments: buildAdjustmentsWidget(dash),
    "fixed-revenue": buildFixedRevenueWidget(dash),
    pending: buildPendingWidget(dash),
  };
}
