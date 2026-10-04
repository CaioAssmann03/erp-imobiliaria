import { cn } from "@/lib/utils";

/** Status discreto: ponto cheio (ativo) ou vazado (inativo) + texto. Sem fundo colorido. */
export function StatusBadge({ active }: { active?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", active ? "text-ink" : "text-ink-faint")}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-ink" : "bg-transparent ring-1 ring-ink-faint"
        )}
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
