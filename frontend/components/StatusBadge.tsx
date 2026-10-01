import { cn } from "@/lib/utils";

/** Status discreto: ponto cheio (ativo) ou vazado (inativo) + texto. Sem fundo colorido. */
export function StatusBadge({ ativo }: { ativo?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", ativo ? "text-ink" : "text-ink-faint")}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          ativo ? "bg-ink" : "bg-transparent ring-1 ring-ink-faint"
        )}
      />
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}
