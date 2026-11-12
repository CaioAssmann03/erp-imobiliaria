/** Segmentos de `/condominiums/<segmento>` que não são o id de um condomínio. */
const RESERVED_SEGMENTS = ["new", "units", "blocks", "cost-centers", "persons", "events"];

/** Seções da página de uma sub-conta; o índice da direita usa estes ids. */
export const COST_CENTER_SECTIONS = [{ id: "dados-da-sub-conta", label: "Dados da sub-conta" }] as const;

export interface CostCentersFrameState {
  /** A coluna da lista de sub-contas envolve a tela vazia do módulo, o cadastro e a edição de uma sub-conta (a tela de sub-contas do condomínio tem a lista no centro). */
  hasFrame: boolean;
  /** Conhecido pela URL no cadastro (`/condominiums/[id]/cost-centers/new`) e, na tela vazia, por `?condominium=`; na edição vem da própria sub-conta. */
  condominiumId: string | null;
  costCenterId: string | null;
  /** O cadastro de uma sub-conta nova (com ou sem condomínio já escolhido). */
  isNew: boolean;
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/**
 * Que coluna de sub-contas uma URL tem: `/condominiums/cost-centers` (a tela vazia do módulo, em que se escolhe o condomínio; `?condominium=` o
 * escolhe de saída), `/condominiums/cost-centers/new` (cadastro sem condomínio: só pede o condomínio), `/condominiums/[id]/cost-centers/new` (cadastro) e `/condominiums/cost-centers/[costCenterId]` (edição). No celular, a
 * lista e a sub-conta aberta são telas separadas.
 */
export function costCentersFrameState(pathname: string | null, search: { condominium?: string | null } = {}): CostCentersFrameState {
  const none: CostCentersFrameState = { hasFrame: false, condominiumId: null, costCenterId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, fourth] = pathname.split("/");
  if (root !== "condominiums" || !second) return none;

  if (second === "cost-centers" && !third) {
    return { ...none, hasFrame: true, condominiumId: search.condominium || null, showListOnPhone: true, showPageOnPhone: false };
  }

  if (second === "cost-centers" && third === "new" && fourth === undefined) {
    return { ...none, hasFrame: true, isNew: true };
  }
  if (!RESERVED_SEGMENTS.includes(second) && third === "cost-centers" && fourth === "new") {
    return { ...none, hasFrame: true, condominiumId: second, isNew: true };
  }
  if (second === "cost-centers" && third && third !== "new" && fourth === undefined) {
    return { ...none, hasFrame: true, costCenterId: third };
  }
  return none;
}

/** A tela de nova sub-conta; sem condomínio é a que pede para escolhê-lo (o **+** da lista sem condomínio escolhido). */
export const newCostCenterUrl = (condominiumId?: string) => (condominiumId ? `/condominiums/${condominiumId}/cost-centers/new` : "/condominiums/cost-centers/new");
export const costCenterUrl = (costCenterId: string) => `/condominiums/cost-centers/${costCenterId}`;
