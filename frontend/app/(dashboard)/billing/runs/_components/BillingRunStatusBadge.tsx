import { runStatusLabel } from "@/lib/billing-documents";
import { cn } from "@/lib/utils";

const STYLE: Record<string, { text: string; dot: string }> = {
  running: { text: "text-ink", dot: "bg-ink-soft" },
  succeeded: { text: "text-success", dot: "bg-success" },
  partial: { text: "text-ink", dot: "bg-ink-soft" },
  failed: { text: "text-danger", dot: "bg-danger" },
};

/** Situação de uma execução da emissão mensal. */
export function BillingRunStatusBadge({ status }: { status: string }) {
  const style = STYLE[status] ?? STYLE.running;
  return (
    <span className={cn("inline-flex items-center gap-2", style.text)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {runStatusLabel(status)}
    </span>
  );
}
