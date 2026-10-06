import { cn } from "@/lib/utils";

export function StatusBadge({ active }: { active?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", active ? "text-ink" : "text-ink-faint")}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          active
            ? "bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_20%,transparent)]"
            : "bg-transparent ring-1 ring-ink-faint"
        )}
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
