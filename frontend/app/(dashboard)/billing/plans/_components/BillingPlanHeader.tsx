"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingPlansRetrieve } from "@/lib/api/generated";
import { billingPlansUrl } from "@/lib/billing/billing-plan-workspace";
import { describeValidity } from "@/lib/billing/billing-plan-payload";

import { usePlansScope } from "./use-plans-scope";

/** No celular, onde a lista não fica ao lado, o "voltar" à lista dos planos no alto da tela. */
function BackToPlans() {
  const scope = usePlansScope();

  return (
    <div className="lg:hidden">
      <BackLink href={billingPlansUrl(scope)} label="Planos de cobrança" />
    </div>
  );
}

function Title({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-title">{title}</h1>
      {detail && <span className="text-body text-ink-soft">{detail}</span>}
    </div>
  );
}

/** O plano novo: só o título (o condomínio se escolhe no formulário). */
export function NewBillingPlanHeader() {
  return (
    <>
      <BackToPlans />
      <Title title="Novo plano" />
    </>
  );
}

/** Client Component: o plano aberto: o nome e, em cinza, o condomínio, a vigência e "Inativo". Usa a mesma consulta do formulário (uma só chamada). */
export function BillingPlanHeader({ planId }: { planId: string }) {
  const { data: plan } = useBillingPlansRetrieve(planId);
  const detail = plan
    ? [plan.condominium_name, describeValidity(plan.start_month, plan.end_month), plan.active === false ? "Inativo" : null].filter(Boolean).join(" · ")
    : undefined;

  return (
    <>
      <BackToPlans />
      {plan ? <Title title={plan.name} detail={detail} /> : <Skeleton className="mb-6 h-9 w-72 rounded-control" />}
    </>
  );
}
