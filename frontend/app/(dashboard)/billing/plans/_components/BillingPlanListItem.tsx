import type { BillingPlan } from "@/lib/api/generated/models";
import { billingPlanUrl, type BillingPlansScope } from "@/lib/billing/billing-plan-workspace";
import { RegistryListItem } from "@/components/layout/RegistryList";

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
    <RegistryListItem href={billingPlanUrl(plan.id, scope)} isOpen={isOpen} dimmed={dimmed}>
      <span className="block truncate text-body font-medium">{plan.name}</span>
      <span className="block truncate text-caption text-ink-soft">{sub}</span>
    </RegistryListItem>
  );
}
