/** Seções da página de uma unidade, na ordem em que aparecem; o índice da direita usa estes ids. */
export const UNIT_SECTIONS = [
  { id: "dados-gerais", label: "Dados gerais" },
  { id: "proprietario", label: "Proprietário" },
  { id: "inquilino", label: "Inquilino" },
  { id: "cobranca", label: "Cobrança" },
] as const;

export type UnitSectionId = (typeof UNIT_SECTIONS)[number]["id"];

export const unitsUrl = (condominiumId?: string) =>
  condominiumId ? `/condominiums/units?condominium=${condominiumId}` : "/condominiums/units";
export const unitUrl = (condominiumId: string, unitId: string) =>
  `/condominiums/${condominiumId}/units/${unitId}`;
export const newUnitUrl = (condominiumId: string) => `/condominiums/${condominiumId}/units/new`;

/** "Apartamento 101": o tipo e o nome, como a coluna da lista mostra a unidade. */
export function unitListLabel(typeLabel: string, name: string) {
  return `${typeLabel} ${name}`.trim();
}

export interface UnitsFrameState {
  /** A coluna da lista só envolve as telas do cadastro (não a tabela de pendências nem outras rotas). */
  hasFrame: boolean;
  condominiumId: string | null;
  unitId: string | null;
  isNew: boolean;
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/**
 * Onde o usuário está no cadastro de unidades, a partir da URL: `/condominiums/units` (`?condominium=` escolhe o condomínio;
 * `?pending=` é a tabela de pendências, sem moldura), `/condominiums/[id]/units/new` e `/condominiums/[id]/units/[unitId]`.
 * No celular, a lista e a unidade aberta são telas separadas.
 */
export function unitsFrameState(
  pathname: string | null,
  search: { condominium?: string | null; pending?: string | null } = {}
): UnitsFrameState {
  const none: UnitsFrameState = {
    hasFrame: false,
    condominiumId: null,
    unitId: null,
    isNew: false,
    showListOnPhone: false,
    showPageOnPhone: true,
  };
  if (!pathname) return none;
  const [, root, second, third, fourth, extra] = pathname.split("/");
  if (root !== "condominiums") return none;

  if (second === "units" && (third === undefined || third === "")) {
    if (search.pending) return none;
    return { ...none, hasFrame: true, condominiumId: search.condominium || null, showListOnPhone: true, showPageOnPhone: false };
  }
  if (second && second !== "units" && third === "units" && extra === undefined) {
    const isNew = fourth === "new";
    const unitId = !isNew && fourth ? fourth : null;
    if (!isNew && !unitId) return none;
    return { ...none, hasFrame: true, condominiumId: second, unitId, isNew };
  }
  return none;
}
