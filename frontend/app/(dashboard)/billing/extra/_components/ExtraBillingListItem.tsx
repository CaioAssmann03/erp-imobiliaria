import Link from "next/link";

import type { BillingDocument } from "@/lib/api/generated/models";
import { extraBillingDocumentUrl, type ExtraBillingScope } from "@/lib/billing/extra-billing-workspace";
import { brl, formatMonth } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/**
 * Um boleto extra emitido na lista no padrão da lista de condomínios: a unidade e o valor em cima, o pagador e a competência (mês/ano) embaixo; o vencimento fica no boleto aberto.
 * `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function ExtraBillingListItem({
  document,
  scope,
  isOpen = false,
  dimmed = false,
}: {
  document: BillingDocument;
  scope: ExtraBillingScope;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  return (
    <li>
      <Link
        href={extraBillingDocumentUrl(document.id, scope)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-body font-medium">Unidade {document.unit_name}</span>
          <span className="shrink-0 text-caption tabular-nums text-ink-soft">{brl(document.amount)}</span>
        </span>
        <span className="flex items-baseline justify-between gap-3 text-caption text-ink-soft">
          <span className="truncate">{document.payer_name}</span>
          <span className="shrink-0 tabular-nums">{formatMonth(document.competence_month)}</span>
        </span>
      </Link>
    </li>
  );
}
