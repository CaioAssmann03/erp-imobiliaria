import type { BillingRun } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

const COUNTS = [
  { key: "issued_count", label: "Emitidos" },
  { key: "already_issued_count", label: "Já emitidos" },
  { key: "skipped_count", label: "Pulados" },
  { key: "failed_count", label: "Falhas" },
] as const;

/** As contagens de uma execução, em números grandes sem caixas: os emitidos sempre; as outras só quando houve (o que é zero não precisa ser lido). */
export function BillingRunCounts({ run }: { run: BillingRun }) {
  const shown = COUNTS.filter((count) => count.key === "issued_count" || run[count.key] > 0);

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4">
      {shown.map((count) => (
        <div key={count.key}>
          <dt className="text-caption text-ink-soft">{count.label}</dt>
          <dd className={cn("mt-0.5 text-title tabular-nums", count.key === "failed_count" && "text-danger")}>{run[count.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
