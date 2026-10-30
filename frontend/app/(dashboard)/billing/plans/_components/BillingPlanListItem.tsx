import Link from "next/link";

import type { BillingPlan } from "@/lib/api/generated/models";
import { billingPlanUrl, type BillingPlansScope } from "@/lib/billing/billing-plan-workspace";
import { cn } from "@/lib/utils";

/**
 * Um plano na lista no padrão da lista de condomínios: o nome em cima e, embaixo, o condomínio (só quando a lista mostra todos), a quantidade de itens e
 * "Inativo". `isOpen` marca o aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function BillingPlanListItem({
  plan,
  scope,
  isOpen = false,
  dimmed = false,
}: {
  plan: BillingPlan;
  scope: BillingPlansScope;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  const itemCount = `${plan.items.length} ${plan.items.length === 1 ? "item" : "itens"}`;
  const sub = [scope.condominium ? null : plan.condominium_name, itemCount, plan.active === false ? "Inativo" : null].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={billingPlanUrl(plan.id, scope)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">{plan.name}</span>
        <span className="block truncate text-caption text-ink-soft">{sub}</span>
      </Link>
    </li>
  );
}
