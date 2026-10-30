/** Seções da página de uma sub-conta do catálogo, na ordem em que aparecem; o índice da direita usa estes ids. */
export const CATALOG_SECTIONS = [
  { id: "identificacao", label: "Identificação" },
  { id: "condominios", label: "Condomínios" },
] as const;

/** A sub-conta nova ainda não é usada por condomínio algum: só tem a identificação. */
export const catalogSections = (isNew: boolean) => (isNew ? CATALOG_SECTIONS.slice(0, 1) : CATALOG_SECTIONS);

export const catalogUrl = () => "/finance/cost-center-catalog";
export const newCatalogItemUrl = () => "/finance/cost-center-catalog/new";
export const catalogItemUrl = (itemId: string) => `/finance/cost-center-catalog/${itemId}`;

export interface CatalogFrameState {
  /** A coluna da lista só envolve as telas do catálogo: a vazia, a sub-conta nova e a sub-conta aberta. */
  hasFrame: boolean;
  itemId: string | null;
  isNew: boolean;
  /** No celular a lista e a sub-conta aberta são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/** Que moldura uma URL tem: `/finance/cost-center-catalog` (a vazia), `/finance/cost-center-catalog/new` e `/finance/cost-center-catalog/[itemId]`. */
export function catalogFrameState(pathname: string | null): CatalogFrameState {
  const none: CatalogFrameState = { hasFrame: false, itemId: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, root, second, third, extra] = pathname.split("/");
  if (root !== "finance" || second !== "cost-center-catalog" || extra !== undefined) return none;

  if (third === undefined || third === "") {
    return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  }
  if (third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, itemId: third };
}
