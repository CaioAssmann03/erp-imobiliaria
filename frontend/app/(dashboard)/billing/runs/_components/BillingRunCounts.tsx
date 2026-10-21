import type { BillingRun } from "@/lib/api/generated/models";

const COUNTS = [
  { key: "issued_count", label: "Emitidos" },
  { key: "already_issued_count", label: "Já emitidos" },
  { key: "skipped_count", label: "Pulados" },
  { key: "failed_count", label: "Falhas" },
] as const;

/** As quatro contagens de uma execução. */
export function BillingRunCounts({ run }: { run: BillingRun }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {COUNTS.map((count) => (
        <div key={count.key} className="rounded-panel bg-surface-muted/40 p-4">
          <dt className="text-caption uppercase tracking-wide text-ink-soft">{count.label}</dt>
          <dd className="mt-1 text-title tabular-nums">{run[count.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
