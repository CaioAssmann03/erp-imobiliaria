const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_ONLY = new RegExp(`^${UUID}$`, "i");

const SCREEN_LABELS = { blocks: "Blocos", units: "Unidades", "cost-centers": "Sub-contas", persons: "Pessoas do condomínio" } as const;

/** Os parâmetros de contexto que um endereço de origem pode ter além do próprio `from`. */
const CONTEXT_PARAMS = ["condominium", "unit", "block"];
const MAX_DEPTH = 6;

export interface BackTarget {
  href: string;
  label: string;
}

/** O nome da tela que um caminho do cadastro de condomínios é, ou `null` se não for uma tela em que o "voltar" possa parar. */
function labelOfPath(pathname: string): string | null {
  const patterns: [RegExp, string | ((match: RegExpExecArray) => string)][] = [
    [new RegExp(`^/condominiums/${UUID}$`, "i"), "Condomínio"],
    [new RegExp(`^/condominiums/${UUID}/units/${UUID}$`, "i"), "Unidade"],
    [new RegExp(`^/condominiums/${UUID}/units/${UUID}/persons$`, "i"), "Pessoas da unidade"],
    [new RegExp(`^/condominiums/blocks/${UUID}$`, "i"), "Bloco"],
    [new RegExp(`^/condominiums/blocks/${UUID}/units$`, "i"), "Unidades do bloco"],
    [new RegExp(`^/condominiums/cost-centers/${UUID}$`, "i"), "Sub-conta"],
    [new RegExp(`^/condominiums/${UUID}/(blocks|units|cost-centers|persons)$`, "i"), (match) => SCREEN_LABELS[match[1].toLowerCase() as keyof typeof SCREEN_LABELS]],
  ];
  for (const [pattern, label] of patterns) {
    const match = pattern.exec(pathname);
    if (match) return typeof label === "string" ? label : label(match);
  }
  return null;
}

/**
 * Para onde o "voltar" leva: a tela de onde se chegou (`?from=`, o endereço dela **com o que ela mesma carrega**, inclusive o `from` dela). Assim o
 * caminho é uma pilha de verdade: condomínio → Blocos → bloco → unidades do bloco → unidade volta passo a passo, e cada tela, ao ser reaberta pelo
 * "voltar", ainda sabe de onde veio. Só vale uma tela do cadastro de condomínios, com no máximo os parâmetros `condominium`, `unit`, `block` (UUID) e
 * um `from` também válido; qualquer outro valor é ignorado, porque o endereço vira um link.
 */
export function backTargetOf(value: string | null, depth = 0): BackTarget | null {
  if (!value || depth > MAX_DEPTH || !value.startsWith("/") || value.startsWith("//")) return null;
  let url: URL;
  try {
    url = new URL(value, "http://local.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "http://local.invalid" || url.hash) return null;
  const label = labelOfPath(url.pathname);
  if (!label) return null;

  const kept = new URLSearchParams();
  for (const [key, param] of url.searchParams) {
    if (key === "from") {
      const nested = backTargetOf(param, depth + 1);
      if (!nested) return null;
      kept.set("from", nested.href);
    } else if (CONTEXT_PARAMS.includes(key) && UUID_ONLY.test(param)) {
      kept.set(key, param);
    } else {
      return null;
    }
  }
  const query = kept.toString();
  return { href: query ? `${url.pathname}?${query}` : url.pathname, label };
}

/** O mesmo endereço com os parâmetros dados (os vazios são ignorados); o que o endereço já tinha, e o `#` dele, ficam. */
export function withParams(href: string, extra: Record<string, string | null | undefined>): string {
  const [withoutHash, hash] = href.split("#");
  const [path, query = ""] = withoutHash.split("?");
  const params = new URLSearchParams(query);
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
  const search = params.toString();
  return `${path}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

/** O mesmo endereço com `from` (a tela atual, para o "voltar" da próxima voltar a ela); sem `from`, o endereço como veio. */
export function withFrom(href: string, from: string | null | undefined): string {
  return withParams(href, { from });
}

/**
 * O endereço da página de um registro para quem está numa sub-tela dele: se a sub-tela veio dessa mesma página, volta a ela do jeito que estava
 * (com o `from` dela); se veio de outra, abre a página levando essa origem. Mantém a pilha do "voltar" inteira ao trocar entre a página e as sub-telas.
 */
export function pageKeepingOrigin(pagePath: string, fromParam: string | null): string {
  const target = backTargetOf(fromParam);
  if (!target) return pagePath;
  return target.href.split("?")[0] === pagePath ? target.href : withFrom(pagePath, target.href);
}
