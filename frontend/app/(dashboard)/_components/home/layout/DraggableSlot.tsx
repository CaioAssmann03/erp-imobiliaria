"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { isItemId, spanOf, type DashboardItemId } from "./dashboard-layout";
import { useDashboardEdit } from "./DashboardEditProvider";
import { useDashboardLayout } from "./use-dashboard-layout";

const STEP: Record<string, -1 | 1> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

/**
 * O lugar de um widget na grade. Fora da edição só dá a largura. Na edição o card continua inteiro e legível, inerte (nada dentro dele é
 * clicável) e levemente "levantado"; só o "×" para tirá-lo aparece, e apenas ao passar o mouse (sempre, em tela de toque): arrasta-se o card inteiro sobre outro para trocar as posições, ou, com o
 * foco nele, as setas do teclado o movem.
 */
export function DraggableSlot({ id, title, children }: { id: DashboardItemId; title: string; children: React.ReactNode }) {
  const { editing } = useDashboardEdit();
  const { actions } = useDashboardLayout();
  const [over, setOver] = useState(false);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        "group/slot relative rounded-card outline-none transition duration-200",
        spanOf(id),
        editing && "scale-[0.985] cursor-grab ring-1 ring-border hover:ring-ink-faint focus-visible:ring-2 focus-visible:ring-brand active:cursor-grabbing",
        over && "ring-2 ring-brand",
        dragging && "opacity-40",
      )}
      draggable={editing}
      tabIndex={editing ? 0 : undefined}
      aria-label={editing ? `${title}. Use as setas para mover.` : undefined}
      onKeyDown={(event) => {
        const step = STEP[event.key];
        if (!editing || !step || event.target !== event.currentTarget) return;
        event.preventDefault();
        actions.shift(id, step);
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onDragOver={(event) => {
        if (!editing) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const dragged = event.dataTransfer.getData("text/plain");
        if (editing && isItemId(dragged)) actions.move(dragged, id);
      }}
    >
      <div className="h-full" inert={editing}>
        {children}
      </div>
      {editing && (
        <button
          type="button"
          aria-label={`Tirar ${title} do painel`}
          title="Tirar do painel"
          onClick={() => actions.hide(id)}
          className="absolute -left-2 -top-2 z-10 grid size-6 place-items-center rounded-full bg-ink text-ink-foreground opacity-0 shadow-float transition-opacity outline-none group-hover/slot:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand [@media(hover:none)]:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
