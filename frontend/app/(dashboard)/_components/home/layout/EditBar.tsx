"use client";

import { useEffect } from "react";

import { AddWidgetMenu } from "./AddWidgetMenu";
import { useDashboardEdit } from "./DashboardEditProvider";
import { useDashboardLayout } from "./use-dashboard-layout";

const ACTION = "inline-flex h-8 items-center rounded-button px-3 text-body font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand";

/**
 * A barra escura que flutua embaixo da tela enquanto se personaliza o painel (as cores invertidas, como os toasts, para não se confundir com
 * os cards): adicionar um card, voltar ao padrão e concluir. Não cobre nada do painel; Esc também conclui.
 */
export function EditBar() {
  const { setEditing } = useDashboardEdit();
  const { actions } = useDashboardLayout();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setEditing]);

  return (
    <div
      role="toolbar"
      aria-label="Personalizar painel"
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-panel bg-ink p-1.5 text-ink-foreground shadow-float"
    >
      <span className="hidden px-3 text-caption text-ink-foreground/60 md:inline">Arraste os cards para mudar a posição</span>
      <AddWidgetMenu />
      <button type="button" onClick={actions.reset} className={`${ACTION} hover:bg-ink-foreground/15`}>
        Restaurar
      </button>
      <button type="button" onClick={() => setEditing(false)} className={`${ACTION} bg-ink-foreground text-ink hover:bg-ink-foreground/85`}>
        Concluído
      </button>
    </div>
  );
}
