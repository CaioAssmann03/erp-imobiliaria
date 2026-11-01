import { buildWidgets } from "../widgets";
import type { DashboardItemId } from "./dashboard-layout";

const ADJUSTMENTS = { title: "Próximos reajustes", description: "Condomínios com reajuste previsto, do mais próximo ao mais distante" };

/** O nome e a descrição de um card do painel: os dos widgets, para o painel e a personalização nunca divergirem. */
export function itemInfo(id: DashboardItemId): { title: string; description?: string } {
  return id === "upcoming-adjustments" ? ADJUSTMENTS : buildWidgets(undefined)[id];
}
