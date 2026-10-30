/** Segmentos de `/condominiums/<segmento>` que não são o id de um condomínio. */
const RESERVED_SEGMENTS = ["new", "units", "blocks", "cost-centers", "persons", "events"];

/** Seções da página de um bloco; o menu da direita usa estes ids. */
export const BLOCK_SECTIONS = [{ id: "dados-gerais", label: "Dados gerais" }] as const;

export interface BlocksFrameState {
  /** A coluna da lista de blocos só envolve o cadastro e a edição de um bloco (a tela de blocos do condomínio tem a lista no centro). */
  hasFrame: boolean;
  /** Conhecido pela URL só no cadastro (`/condominiums/[id]/blocks/new`); na edição vem do próprio bloco. */
  condominiumId: string | null;
  blockId: string | null;
  /** A sub-tela do bloco aberta no meio (hoje só `units`: as unidades dele); `null` na página do bloco. */
  subScreen: "units" | null;
}

/** Que coluna de blocos uma URL tem: `/condominiums/[id]/blocks/new` (cadastro), `/condominiums/blocks/[blockId]` (edição) e a sub-tela `/condominiums/blocks/[blockId]/units`. */
export function blocksFrameState(pathname: string | null): BlocksFrameState {
  const none: BlocksFrameState = { hasFrame: false, condominiumId: null, blockId: null, subScreen: null };
  if (!pathname) return none;
  const [, root, second, third, fourth, extra] = pathname.split("/");
  if (root !== "condominiums" || !second) return none;

  if (!RESERVED_SEGMENTS.includes(second) && third === "blocks" && fourth === "new") {
    return { ...none, hasFrame: true, condominiumId: second };
  }
  if (second === "blocks" && third && third !== "new" && extra === undefined && (fourth === undefined || fourth === "units")) {
    return { ...none, hasFrame: true, blockId: third, subScreen: fourth === "units" ? "units" : null };
  }
  return none;
}

export const newBlockUrl = (condominiumId: string) => `/condominiums/${condominiumId}/blocks/new`;
export const blockUrl = (blockId: string) => `/condominiums/blocks/${blockId}`;
/** A sub-tela de um bloco com as unidades dele; abrir uma unidade leva ao módulo de unidades. */
export const blockUnitsUrl = (blockId: string) => `${blockUrl(blockId)}/units`;
