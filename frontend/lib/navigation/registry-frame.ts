// Sem imports: os módulos `*-workspace.ts` que o usam são testados direto pelo Node (que só resolve imports relativos com extensão).

export interface RegistryFrame {
  /** A coluna da lista envolve a tela vazia do módulo, o cadastro novo (se houver) e o registro aberto. */
  hasFrame: boolean;
  /** O registro aberto (`/<root>/<segment>/[id]`); `null` na tela vazia e no cadastro novo. */
  id: string | null;
  isNew: boolean;
  /** No celular a lista e o registro aberto são telas separadas. */
  showListOnPhone: boolean;
  showPageOnPhone: boolean;
}

/**
 * Que moldura uma URL tem num módulo de 3 colunas simples: `/<root>/<segment>` (a vazia), `/<root>/<segment>/new` (só com `hasNew`) e
 * `/<root>/<segment>/[id]`. Qualquer outro caminho não tem moldura. Cada módulo troca `id` pelo nome do seu registro (`entryId`, `planId`...).
 */
export function registryFrame(pathname: string | null, root: string, segment: string, hasNew = true): RegistryFrame {
  const none: RegistryFrame = { hasFrame: false, id: null, isNew: false, showListOnPhone: false, showPageOnPhone: true };
  if (!pathname) return none;
  const [, first, second, third, extra] = pathname.split("/");
  if (first !== root || second !== segment || extra !== undefined) return none;

  if (third === undefined || third === "") return { ...none, hasFrame: true, showListOnPhone: true, showPageOnPhone: false };
  if (hasNew && third === "new") return { ...none, hasFrame: true, isNew: true };
  return { ...none, hasFrame: true, id: third };
}
