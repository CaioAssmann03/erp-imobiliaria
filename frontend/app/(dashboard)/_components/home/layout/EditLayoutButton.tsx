"use client";

import { LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useDashboardEdit } from "./DashboardEditProvider";

/** No cabeçalho do painel, à direita da saudação: liga e desliga a personalização (fica marcado enquanto ligada). */
export function EditLayoutButton() {
  const { editing, setEditing } = useDashboardEdit();

  return (
    <Button
      variant={editing ? "secondary" : "ghost"}
      size="icon"
      aria-label="Personalizar painel"
      aria-pressed={editing}
      title="Personalizar painel"
      onClick={() => setEditing(!editing)}
    >
      <LayoutGrid className="size-4" />
    </Button>
  );
}
