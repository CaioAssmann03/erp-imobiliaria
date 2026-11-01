import type { BillingEvent } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/format/format";
import { eventUrl } from "@/lib/billing/billing-event-workspace";
import { RegistryListItem } from "@/components/layout/RegistryList";

/**
 * Um evento na lista no padrão da lista de condomínios: o código (cinza) e o nome em cima; embaixo "Receita da imobiliária" e "Inativo".
 * `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function BillingEventListItem({ event, isOpen = false, dimmed = false }: { event: BillingEvent; isOpen?: boolean; dimmed?: boolean }) {
  const sub = [event.credits_company ? "Receita da imobiliária" : null, event.active === false ? "Inativo" : null].filter(Boolean).join(" · ");

  return (
    <RegistryListItem href={eventUrl(event.id)} isOpen={isOpen} dimmed={dimmed}>
      <span className="block truncate text-body font-medium">
        <span className="tabular-nums">{formatCode(event.code)}</span>
        <span className="text-ink-faint"> · </span>
        {event.name}
      </span>
      <span className="block truncate text-caption text-ink-soft">{sub || "—"}</span>
    </RegistryListItem>
  );
}
