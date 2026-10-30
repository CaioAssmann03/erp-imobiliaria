/**
 * O atalho da busca por plataforma: ⌘K no Mac e no iOS, Ctrl+K no Windows e no Linux.
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

/** O texto de `navigator.platform` (ou `userAgentData.platform`) é de um aparelho da Apple. */
export const isApplePlatform = (platform: string): boolean => /mac|iphone|ipad|ipod/i.test(platform);

/** O rótulo que o botão da busca mostra. */
export const searchShortcutLabel = (apple: boolean): string => (apple ? "⌘K" : "Ctrl K");

export interface ShortcutEvent {
  key: string;
  code?: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/**
 * Se a tecla apertada abre a busca: ⌘ no Apple, Ctrl nas demais. A tecla Windows não conta: o sistema a usa
 * (Windows+K é "Transmitir") e a página nem recebe o evento. Vale a tecla física K (`code`), então outros
 * teclados e layouts funcionam.
 */
export function matchesSearchShortcut(event: ShortcutEvent, apple: boolean): boolean {
  const modifier = apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  const isK = event.code === "KeyK" || event.key.toLowerCase() === "k";
  return modifier && isK && !event.altKey && !event.shiftKey;
}
