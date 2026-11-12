import { payableStatusLabel } from "@/lib/schemas/account-payable";
import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  open: "text-ink",
  paid: "text-success",
  cancelled: "text-ink-faint",
};

/** Situação de uma conta a pagar: aberta, paga ou cancelada. */
export function PayableStatusBadge({ status, overdue = false }: { status: string; overdue?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", overdue ? "text-danger" : STYLE[status])}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "cancelled" ? "bg-transparent ring-1 ring-ink-faint" : overdue ? "bg-danger" : status === "paid" ? "bg-success" : "bg-ink-soft"
        )}
      />
      {overdue ? "Vencida" : payableStatusLabel(status)}
    </span>
  );
}
