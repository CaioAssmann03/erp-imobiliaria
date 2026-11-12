import { cn } from "@/lib/utils";

import { isWide, type DashboardItemId } from "./dashboard-layout";

const LINE = "h-1 rounded-full bg-ink-foreground/30";

function Strokes({ id }: { id: DashboardItemId }) {
  if (id === "billing-chart") {
    return (
      <svg viewBox="0 0 100 20" className="h-4 w-full text-brand" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
        <path d="M2 16 C 18 4, 28 18, 48 10 S 78 2, 98 8" />
      </svg>
    );
  }
  if (id === "upcoming-adjustments") {
    return (
      <div className="space-y-1">
        <div className={cn(LINE, "w-full")} />
        <div className={cn(LINE, "w-2/3")} />
        <div className={cn(LINE, "w-1/2")} />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-1/2 rounded-full bg-ink-foreground/50" />
      <div className={cn(LINE, "w-full")} />
    </div>
  );
}

/** Uma miniatura do que o card mostra, na largura relativa que ele tem no painel (estreito ou largo). Feita para o fundo escuro do menu de adicionar. */
export function WidgetSketch({ id }: { id: DashboardItemId }) {
  return (
    <span className={cn("flex h-9 shrink-0 flex-col justify-center rounded-md border border-ink-foreground/20 bg-ink-foreground/10 px-1.5", isWide(id) ? "w-16" : "w-10")} aria-hidden>
      <Strokes id={id} />
    </span>
  );
}
