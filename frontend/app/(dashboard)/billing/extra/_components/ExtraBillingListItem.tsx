import type { BillingDocument } from "@/lib/api/generated/models";
import { extraBillingDocumentUrl, type ExtraBillingScope } from "@/lib/billing/extra-billing-workspace";
import { brl, formatMonth } from "@/lib/format/format";
import { RegistryListItem } from "@/components/layout/RegistryList";

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
    <RegistryListItem href={extraBillingDocumentUrl(document.id, scope)} isOpen={isOpen} dimmed={dimmed}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="truncate text-body font-medium">Unidade {document.unit_name}</span>
        <span className="shrink-0 text-caption tabular-nums text-ink-soft">{brl(document.amount)}</span>
      </span>
      <span className="flex items-baseline justify-between gap-3 text-caption text-ink-soft">
        <span className="truncate">{document.payer_name}</span>
        <span className="shrink-0 tabular-nums">{formatMonth(document.competence_month)}</span>
      </span>
    </RegistryListItem>
  );
}
