import { SIDEBAR_COOKIE } from "@/lib/auth";

/** Avisa o `Sidebar` (e quem mais ler `data-sidebar`) de que o atributo do <html> mudou. */
export const SIDEBAR_EVENT = "sidebar-change";

export function setSidebarOpen(open: boolean) {
  document.documentElement.dataset.sidebar = open ? "open" : "closed";
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}

/** A escolha salva da pessoa (cookie); sem cookie, a lateral fica aberta. */
export function savedSidebarOpen() {
  return !document.cookie.split("; ").includes(`${SIDEBAR_COOKIE}=0`);
}
