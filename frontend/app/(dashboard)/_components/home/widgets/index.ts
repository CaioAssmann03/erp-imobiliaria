import type { Dashboard } from "@/lib/api/generated/models";

import { buildAccountsPayableWidget } from "./accounts-payable-widget";
import { buildAdjustmentsWidget } from "./adjustments-widget";
import { buildBillingChartWidget } from "./billing-chart-widget";
import { buildBillingMonthWidget } from "./billing-month-widget";
import { buildCondominiumsWidget } from "./condominiums-widget";
import { buildDelinquencyWidget } from "./delinquency-widget";
import { buildFixedRevenueWidget } from "./fixed-revenue-widget";
import { buildPendingWidget } from "./pending-widget";
import { buildResponsiblesWidget } from "./responsibles-widget";
import type { Widget, WidgetId } from "./types";

export { WIDGET_IDS, type Widget, type WidgetId } from "./types";

export function buildWidgets(dash: Dashboard | undefined): Record<WidgetId, Widget> {
  return {
    condominiums: buildCondominiumsWidget(dash),
    "accounts-payable": buildAccountsPayableWidget(dash),
    delinquency: buildDelinquencyWidget(dash),
    "billing-month": buildBillingMonthWidget(dash),
    "billing-chart": buildBillingChartWidget(dash),
    responsibles: buildResponsiblesWidget(dash),
    adjustments: buildAdjustmentsWidget(dash),
    "fixed-revenue": buildFixedRevenueWidget(dash),
    pending: buildPendingWidget(dash),
  };
}
