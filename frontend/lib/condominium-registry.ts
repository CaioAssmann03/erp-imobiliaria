/** Seções da página de um condomínio, na ordem em que aparecem; o índice da direita usa estes ids. */
export const REGISTRY_SECTIONS = [
  { id: "dados-gerais", label: "Dados gerais" },
  { id: "taxa-e-cobranca", label: "Taxa e cobrança" },
  { id: "blocos-e-unidades", label: "Blocos e unidades" },
  { id: "sub-contas", label: "Sub-contas" },
] as const;

export type RegistrySectionId = (typeof REGISTRY_SECTIONS)[number]["id"];

/** Primeiro segmento depois de `/condominiums` que não é o id de um condomínio. */
const RESERVED_SEGMENTS = ["new", "units", "blocks", "cost-centers"];

/** URL da página de um condomínio, opcionalmente já na seção. */
export function condominiumUrl(condominiumId: string, section?: RegistrySectionId) {
  return `/condominiums/${condominiumId}${section ? `#${section}` : ""}`;
}

/** Telas com a coluna da lista de condomínios: a vazia, o cadastro novo e a página de um condomínio. */
export function isRegistryPath(pathname: string | null) {
  if (!pathname) return false;
  const [, root, segment, extra] = pathname.split("/");
  if (root !== "condominiums") return false;
  if (segment === undefined || segment === "") return true;
  if (segment !== "new" && RESERVED_SEGMENTS.includes(segment)) return false;
  return extra === undefined || extra === "";
}

/** O condomínio aberto (o id da URL), ou `null` na tela vazia, no cadastro novo e fora do cadastro. */
export function selectedCondominiumId(pathname: string | null) {
  if (!isRegistryPath(pathname)) return null;
  const segment = pathname?.split("/")[2];
  return segment && !RESERVED_SEGMENTS.includes(segment) ? segment : null;
}

/** A seção do índice marcada como atual: a última (na ordem da página) que toca a faixa de leitura, porque a seguinte já começou nela. */
export function currentSection(visibleIds: ReadonlySet<string>): RegistrySectionId | null {
  return REGISTRY_SECTIONS.findLast((section) => visibleIds.has(section.id))?.id ?? null;
}

/**
 * O que a moldura do cadastro mostra: a coluna da lista só nas telas do cadastro; no celular, a lista e a página aberta
 * são telas separadas (a lista na tela vazia, a página quando há um condomínio ou o cadastro novo aberto).
 */
export function registryLayout(pathname: string | null) {
  const hasFrame = isRegistryPath(pathname);
  const hasOpenPage = hasFrame && pathname !== "/condominiums";
  return {
    hasFrame,
    showListOnPhone: hasFrame && !hasOpenPage,
    showPageOnPhone: !hasFrame || hasOpenPage,
  };
}
