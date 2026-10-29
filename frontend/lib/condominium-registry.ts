/** Seções da página de um condomínio (só o que é do próprio condomínio), na ordem em que aparecem; o índice da direita usa estes ids. */
export const REGISTRY_SECTIONS = [
  { id: "dados-gerais", label: "Dados gerais" },
  { id: "taxa-e-cobranca", label: "Taxa e cobrança" },
] as const;

export type RegistrySectionId = (typeof REGISTRY_SECTIONS)[number]["id"];

/** As telas próprias de um condomínio (o que não é dele em si), abertas pelo menu da direita, cada uma com a sua lista no centro. */
export const CONDOMINIUM_PAGES = [
  { key: "blocks", label: "Blocos" },
  { key: "units", label: "Unidades" },
  { key: "cost-centers", label: "Sub-contas" },
] as const;

export type CondominiumPageKey = (typeof CONDOMINIUM_PAGES)[number]["key"];

/** URL de uma tela própria do condomínio: a lista de blocos, de unidades ou de sub-contas dele. */
export function condominiumPageUrl(condominiumId: string, page: CondominiumPageKey) {
  return `/condominiums/${condominiumId}/${page}`;
}

/** Primeiro segmento depois de `/condominiums` que não é o id de um condomínio. */
const RESERVED_SEGMENTS = ["new", "units", "blocks", "cost-centers", "persons"];

/** URL da página de um condomínio, opcionalmente já na seção. */
export function condominiumUrl(condominiumId: string, section?: RegistrySectionId) {
  return `/condominiums/${condominiumId}${section ? `#${section}` : ""}`;
}

/** Telas com a coluna da lista de condomínios: a vazia, o cadastro novo, a página de um condomínio e as listas de blocos, unidades e sub-contas dele. */
export function isRegistryPath(pathname: string | null) {
  if (!pathname) return false;
  const [, root, segment, extra, deeper] = pathname.split("/");
  if (root !== "condominiums") return false;
  if (segment === undefined || segment === "") return true;
  if (segment !== "new" && RESERVED_SEGMENTS.includes(segment)) return false;
  if (deeper) return false;
  return extra === undefined || extra === "" || extra === "blocks" || extra === "units" || extra === "cost-centers";
}

/** O condomínio aberto (o id da URL), ou `null` na tela vazia, no cadastro novo e fora do cadastro. */
export function selectedCondominiumId(pathname: string | null) {
  if (!isRegistryPath(pathname)) return null;
  const segment = pathname?.split("/")[2];
  return segment && !RESERVED_SEGMENTS.includes(segment) ? segment : null;
}

/** A tela própria aberta de um condomínio (blocos, unidades ou sub-contas), ou `null` na página de dados dele e fora do cadastro. */
export function selectedCondominiumPage(pathname: string | null): CondominiumPageKey | null {
  if (!selectedCondominiumId(pathname)) return null;
  const extra = pathname?.split("/")[3];
  return CONDOMINIUM_PAGES.find((page) => page.key === extra)?.key ?? null;
}

/**
 * A linha de leitura (px, a partir do topo da janela) do índice de seções: a 30% da altura da tela; nos últimos 60% da tela que faltam
 * rolar até o fim da página ela desce até a borda de baixo, para a última seção (mesmo curta, que nunca chegaria aos 30%) ser alcançada.
 * Com `firstTop` (o topo da primeira seção na página, em px), no topo da página a linha parte dele, e o marcador repousa no primeiro item, e
 * sobe até a linha normal à medida que se rola.
 */
export function readingLine(viewportHeight: number, scrolled: number, maxScroll: number, firstTop?: number): number {
  const base = Math.max(120, viewportHeight * 0.3);
  const stretch = viewportHeight * 0.6;
  const remaining = Math.max(0, maxScroll - scrolled);
  const progress = remaining >= stretch ? 0 : 1 - remaining / stretch;
  const line = base + (viewportHeight - base) * progress;

  const lead = firstTop === undefined ? 0 : Math.max(0, base - firstTop);
  const lift = lead === 0 ? 0 : Math.max(0, 1 - scrolled / lead);
  return line - lead * lift;
}

/**
 * Onde o marcador do índice fica, em "itens": 0 é o primeiro, 1 o segundo, 1,5 a metade do caminho entre o segundo e o terceiro.
 * `tops` é o topo de cada seção na janela, na ordem da página (`Infinity` para a que ainda não existe). Quando o topo de uma seção alcança
 * a linha de leitura o marcador chega ao item dela; daí até o topo da seguinte ele anda em proporção; na última, fica no último item.
 */
export function sectionPosition(tops: readonly number[], line: number): number {
  let index = -1;
  tops.forEach((top, position) => {
    if (top <= line) index = position;
  });
  if (index === -1) return 0;
  const next = tops[index + 1];
  if (next === undefined) return index;
  return index + Math.min(1, Math.max(0, (line - tops[index]) / (next - tops[index])));
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
