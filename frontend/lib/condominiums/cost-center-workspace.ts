/** Segmentos de `/condominiums/<segmento>` que não são o id de um condomínio. */
const RESERVED_SEGMENTS = ["new", "units", "blocks", "cost-centers", "persons", "events"];

export interface CostCentersFrameState {
  /** A coluna da lista de sub-contas só envolve o cadastro e a edição de uma sub-conta (a tela de sub-contas do condomínio tem a lista no centro). */
  hasFrame: boolean;
  /** Conhecido pela URL só no cadastro (`/condominiums/[id]/cost-centers/new`); na edição vem da própria sub-conta. */
  condominiumId: string | null;
  costCenterId: string | null;
}

/** Que coluna de sub-contas uma URL tem: `/condominiums/[id]/cost-centers/new` (cadastro) e `/condominiums/cost-centers/[costCenterId]` (edição). */
export function costCentersFrameState(pathname: string | null): CostCentersFrameState {
  const none: CostCentersFrameState = { hasFrame: false, condominiumId: null, costCenterId: null };
  if (!pathname) return none;
  const [, root, second, third, fourth] = pathname.split("/");
  if (root !== "condominiums" || !second) return none;

  if (!RESERVED_SEGMENTS.includes(second) && third === "cost-centers" && fourth === "new") {
    return { hasFrame: true, condominiumId: second, costCenterId: null };
  }
  if (second === "cost-centers" && third && third !== "new" && fourth === undefined) {
    return { hasFrame: true, condominiumId: null, costCenterId: third };
  }
  return none;
}

export const newCostCenterUrl = (condominiumId: string) => `/condominiums/${condominiumId}/cost-centers/new`;
export const costCenterUrl = (costCenterId: string) => `/condominiums/cost-centers/${costCenterId}`;
