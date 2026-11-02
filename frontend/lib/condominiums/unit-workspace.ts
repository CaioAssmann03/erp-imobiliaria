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
/** A sub-tela de uma unidade com as pessoas dela (proprietário e inquilino vigentes). */
export const unitPeopleUrl = (condominiumId: string, unitId: string) => `${unitUrl(condominiumId, unitId)}/persons`;
/** A tela de nova unidade; sem condomínio é a que pede para escolhê-lo (o **+** da lista sem condomínio escolhido). */
export const newUnitUrl = (condominiumId?: string) => (condominiumId ? `/condominiums/${condominiumId}/units/new` : "/condominiums/units/new");

/**
 * A query de uma tela de unidade com o bloco (`?block=`) trocado, e todo o resto (`from`, `condominium`, `pending`) igual. É por ela que o campo Bloco do
 * formulário e o bloco da lista da esquerda andam juntos: um escreve o endereço e o outro o lê. Bloco vazio vira `?block=` (presente e vazio, que limpa
 * o bloco da lista), diferente de um endereço sem `block`, que a lista ignora.
 */
export function withBlockParam(search: string, block: string): string {
  const params = new URLSearchParams(search);
  params.set("block", block);
  return params.toString();
}

/** "Apartamento 101": o tipo e o nome, como a coluna da lista mostra a unidade. */
export function unitListLabel(typeLabel: string, name: string) {
  return `${typeLabel} ${name}`.trim();
}

export interface UnitsFrameState {
  /** A coluna da lista só envolve as telas do cadastro (não outras rotas). */
  hasFrame: boolean;
  condominiumId: string | null;
  unitId: string | null;
  /** A sub-tela da unidade aberta no meio (hoje só `persons`: as pessoas dela); `null` na página da unidade. */
  subScreen: "persons" | null;
  isNew: boolean;
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/**
 * Onde o usuário está no cadastro de unidades, a partir da URL: `/condominiums/units` (`?condominium=` escolhe o condomínio;
 * `?pending=` é o atalho das Pendências do painel: a lista da esquerda abre filtrada, de todos os condomínios), `/condominiums/units/new` (a nova unidade sem condomínio: só pede o condomínio), `/condominiums/[id]/units/new` e `/condominiums/[id]/units/[unitId]`.
 * No celular, a lista e a unidade aberta são telas separadas.
 */
export function unitsFrameState(
  pathname: string | null,
  search: { condominium?: string | null } = {}
): UnitsFrameState {
  const none: UnitsFrameState = {
    hasFrame: false,
    condominiumId: null,
    unitId: null,
    subScreen: null,
    isNew: false,
    showListOnPhone: false,
    showPageOnPhone: true,
  };
  if (!pathname) return none;
  const [, root, second, third, fourth, extra] = pathname.split("/");
  if (root !== "condominiums") return none;

  if (second === "units" && (third === undefined || third === "")) {
    return { ...none, hasFrame: true, condominiumId: search.condominium || null, showListOnPhone: true, showPageOnPhone: false };
  }
  if (second === "units" && third === "new" && fourth === undefined) {
    return { ...none, hasFrame: true, isNew: true };
  }
  if (second && second !== "units" && third === "units" && (extra === undefined || (extra === "persons" && fourth !== "new"))) {
    if (pathname.split("/").length > 6) return none;
    const isNew = fourth === "new";
    const unitId = !isNew && fourth ? fourth : null;
    if (!isNew && !unitId) return none;
    return { ...none, hasFrame: true, condominiumId: second, unitId, isNew, subScreen: extra === "persons" ? "persons" : null };
  }
  return none;
}
