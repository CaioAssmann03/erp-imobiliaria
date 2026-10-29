/** Primeiros segmentos de `/condominiums/...` que não são o id de um condomínio. */
const RESERVED_SEGMENTS = new Set(["new", "units", "blocks", "cost-centers"]);

/** O id do condomínio aberto na URL (`/condominiums/<id>/...`), ou `null` fora de um condomínio. */
export function selectedCondominiumId(pathname: string | null): string | null {
  const segment = pathname?.match(/^\/condominiums\/([^/]+)/)?.[1];
  return segment && !RESERVED_SEGMENTS.has(segment) ? segment : null;
}
