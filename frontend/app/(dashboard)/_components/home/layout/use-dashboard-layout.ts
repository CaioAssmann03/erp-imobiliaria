import { useMemo, useSyncExternalStore } from "react";

import {
  DEFAULT_LAYOUT,
  hideItem,
  moveItem,
  parseLayout,
  serializeLayout,
  shiftItem,
  showItem,
  visibleItems,
  type DashboardItemId,
  type DashboardLayout,
} from "./dashboard-layout";

const STORAGE_KEY = "dashboard-layout";
const CHANGE_EVENT = `${STORAGE_KEY}:change`;

/** Só tem valor quando o storage está indisponível: a escolha vale até recarregar a página. */
let memory: string | null | undefined;

function read() {
  if (memory !== undefined) return memory;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(layout: DashboardLayout) {
  const raw = serializeLayout(layout);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
    memory = undefined;
  } catch {
    memory = raw;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const apply = (change: (layout: DashboardLayout) => DashboardLayout) => write(change(parseLayout(read())));

export const layoutActions = {
  move: (id: DashboardItemId, targetId: DashboardItemId) => apply((layout) => moveItem(layout, id, targetId)),
  shift: (id: DashboardItemId, step: -1 | 1) => apply((layout) => shiftItem(layout, id, step)),
  hide: (id: DashboardItemId) => apply((layout) => hideItem(layout, id)),
  show: (id: DashboardItemId) => apply((layout) => showItem(layout, id)),
  reset: () => write(DEFAULT_LAYOUT),
};

/**
 * A ordem e a visibilidade dos widgets do painel, lembradas neste navegador (não há dado pessoal nem token: só os ids). Até o cliente
 * assumir vale o padrão, o mesmo HTML para todos.
 */
export function useDashboardLayout() {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const layout = useMemo(() => parseLayout(raw), [raw]);
  return { visible: visibleItems(layout), hidden: layout.order.filter((id) => layout.hidden.includes(id)), actions: layoutActions };
}
