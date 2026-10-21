import { issuedNothing, runStatusLabel, type RunCounts } from "@/lib/billing-documents";
import { cn } from "@/lib/utils";

const STYLE: Record<string, { text: string; dot: string }> = {
  running: { text: "text-ink", dot: "bg-ink-soft" },
  succeeded: { text: "text-success", dot: "bg-success" },
  partial: { text: "text-ink", dot: "bg-ink-soft" },
  failed: { text: "text-danger", dot: "bg-danger" },
  warning: { text: "text-warning", dot: "bg-warning" },
};

/** Situação de uma execução da emissão mensal; concluída sem emitir nada aparece como aviso, não como sucesso. */
export function BillingRunStatusBadge({ status, counts }: { status: string; counts?: RunCounts }) {
  const nothingIssued = status === "succeeded" && counts !== undefined && issuedNothing(counts);
  const style = nothingIssued ? STYLE.warning : (STYLE[status] ?? STYLE.running);
  return (
    <span className={cn("inline-flex items-center gap-2", style.text)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {runStatusLabel(status, counts)}
    </span>
  );
}
