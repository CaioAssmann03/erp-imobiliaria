"use client";

import { Popover } from "@base-ui/react/popover";
import { Plus } from "lucide-react";

import { itemInfo } from "./item-info";
import { useDashboardLayout } from "./use-dashboard-layout";
import { WidgetSketch } from "./WidgetSketch";

/** O botão "Adicionar" da barra de edição e a lista só dos cards que estão fora do painel, cada um com uma miniatura do que mostra. */
export function AddWidgetMenu() {
  const { hidden, actions } = useDashboardLayout();

  return (
    <Popover.Root>
      <Popover.Trigger
        disabled={hidden.length === 0}
        className="inline-flex h-8 items-center gap-1.5 rounded-button px-3 text-body font-medium transition-colors outline-none hover:bg-ink-foreground/15 focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-4" />
        Adicionar
        {hidden.length > 0 && <span className="tabular-nums text-ink-foreground/60">{hidden.length}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={14} className="z-50">
          <Popover.Popup className="w-[min(22rem,92vw)] rounded-card bg-ink p-1.5 text-ink-foreground shadow-float outline-none">
            <ul>
              {hidden.map((id) => {
                const { title, description } = itemInfo(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => actions.show(id)}
                      className="flex w-full items-center gap-3 rounded-panel px-2 py-2 text-left transition-colors outline-none hover:bg-ink-foreground/10 focus-visible:bg-ink-foreground/10"
                    >
                      <WidgetSketch id={id} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{title}</span>
                        {description && <span className="block truncate text-caption text-ink-foreground/60">{description}</span>}
                      </span>
                      <Plus className="size-4 shrink-0 opacity-60" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
