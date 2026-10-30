import Link from "next/link";

import type { BillingEvent } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { eventUrl } from "@/lib/billing/billing-event-workspace";
import { cn } from "@/lib/utils";

/**
 * Um evento na lista no padrão da lista de condomínios: o código (cinza) e o nome em cima; embaixo "Receita da imobiliária" e "Inativo".
 * `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function BillingEventListItem({ event, isOpen = false, dimmed = false }: { event: BillingEvent; isOpen?: boolean; dimmed?: boolean }) {
  const sub = [event.credits_company ? "Receita da imobiliária" : null, event.active === false ? "Inativo" : null].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={eventUrl(event.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">
          <span className="tabular-nums">{formatCode(event.code)}</span>
          <span className="text-ink-faint"> · </span>
          {event.name}
        </span>
        <span className="block truncate text-caption text-ink-soft">{sub || "—"}</span>
      </Link>
    </li>
  );
}
