/** Segmentos de `/condominiums/<segmento>` que não são o id de um condomínio. */
const RESERVED_SEGMENTS = ["new", "units", "blocks", "cost-centers", "persons"];

export interface BlocksFrameState {
  /** A coluna da lista de blocos só envolve o cadastro e a edição de um bloco (a tela de blocos do condomínio tem a lista no centro). */
  hasFrame: boolean;
  /** Conhecido pela URL só no cadastro (`/condominiums/[id]/blocks/new`); na edição vem do próprio bloco. */
  condominiumId: string | null;
  blockId: string | null;
}

/** Que coluna de blocos uma URL tem: `/condominiums/[id]/blocks/new` (cadastro) e `/condominiums/blocks/[blockId]` (edição). */
export function blocksFrameState(pathname: string | null): BlocksFrameState {
  const none: BlocksFrameState = { hasFrame: false, condominiumId: null, blockId: null };
  if (!pathname) return none;
  const [, root, second, third, fourth] = pathname.split("/");
  if (root !== "condominiums" || !second) return none;

  if (!RESERVED_SEGMENTS.includes(second) && third === "blocks" && fourth === "new") {
    return { hasFrame: true, condominiumId: second, blockId: null };
  }
  if (second === "blocks" && third && third !== "new" && fourth === undefined) {
    return { hasFrame: true, condominiumId: null, blockId: third };
  }
  return none;
}

export const newBlockUrl = (condominiumId: string) => `/condominiums/${condominiumId}/blocks/new`;
export const blockUrl = (blockId: string) => `/condominiums/blocks/${blockId}`;
