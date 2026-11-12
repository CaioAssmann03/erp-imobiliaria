import { documentStatusLabel } from "@/lib/billing/billing-documents";
import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  issued: "text-ink",
  registered: "text-ink",
  paid: "text-success",
  cancelled: "text-ink-faint",
};

/** Situação de um documento de cobrança; "Vencido" (derivado da data) vale mais que o status guardado. */
export function BillingDocumentStatusBadge({ status, overdue = false }: { status: string; overdue?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", overdue ? "text-danger" : STYLE[status])}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "cancelled" && !overdue
            ? "bg-transparent ring-1 ring-ink-faint"
            : overdue
              ? "bg-danger"
              : status === "paid"
                ? "bg-success"
                : "bg-ink-soft"
        )}
      />
      {documentStatusLabel(status, overdue)}
    </span>
  );
}
