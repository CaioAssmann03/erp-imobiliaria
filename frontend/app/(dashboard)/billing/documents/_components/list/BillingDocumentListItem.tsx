import Link from "next/link";

import type { BillingDocument } from "@/lib/api/generated/models";
import { documentStatusLabel } from "@/lib/billing/billing-documents";
import { billingDocumentUrl, type BillingDocumentsScope } from "@/lib/billing/billing-document-workspace";
import { brl, formatMonth } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/** A situação em texto simples, sem selo: só o que pede atenção ganha cor (vencido em vermelho, pago em verde, cancelado apagado). */
const statusClass = (document: BillingDocument): string =>
  document.is_overdue ? "text-danger" : document.status === "paid" ? "text-success" : document.status === "cancelled" ? "text-ink-faint" : "text-ink-soft";

/**
 * Um documento na lista no padrão da lista de condomínios: a unidade (com o mês, quando a lista não o fixa, e "extra") e o valor em cima; embaixo o pagador e a situação. `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function BillingDocumentListItem({
  document,
  scope,
  isOpen = false,
  dimmed = false,
}: {
  document: BillingDocument;
  scope: BillingDocumentsScope;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  // O mês só aparece quando a lista não o fixa; "extra" marca o boleto avulso.
  const tag = [scope.month ? null : formatMonth(document.reference_month), document.kind === "extra" ? "extra" : null].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={billingDocumentUrl(document.id, scope)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-body font-medium">
            Unidade {document.unit_name}
            {tag && <span className="ml-2 text-caption font-normal text-ink-faint">{tag}</span>}
          </span>
          <span className="shrink-0 text-caption tabular-nums text-ink-soft">{brl(document.amount)}</span>
        </span>
        <span className="flex items-baseline justify-between gap-3 text-caption">
          <span className="truncate text-ink-soft">{document.payer_name}</span>
          <span className={cn("shrink-0", statusClass(document))}>{documentStatusLabel(document.status, document.is_overdue)}</span>
        </span>
      </Link>
    </li>
  );
}
