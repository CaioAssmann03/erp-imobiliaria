"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useBillingPlansRetrieve } from "@/lib/api/generated";
import { billingPlansUrl } from "@/lib/billing/billing-plan-workspace";
import { throwIfPageError } from "@/lib/query/page-error";
import {
  BILLING_PLAN_DEFAULTS,
  billingPlanSchema,
  billingPlanToForm,
  type BillingPlanFormInput,
  type BillingPlanFormOutput,
} from "@/lib/schemas/billing-plan";
import { toast } from "@/lib/errors/toast";

import { IdentificationSection } from "./billing-plan-form/IdentificationSection";
import { ItemsSection } from "./billing-plan-form/ItemsSection";
import { useBillingPlanSubmit } from "./billing-plan-form/use-billing-plan-submit";
import { usePlansScope } from "./use-plans-scope";

/** Cadastro e edição de um plano de cobrança com os seus itens (a lista inteira é enviada junto). No cadastro o condomínio da lista já vem escolhido. */
export function BillingPlanForm({ billingPlanId }: { billingPlanId?: string }) {
  const router = useRouter();
  const scope = usePlansScope();
  const isEdit = billingPlanId !== undefined;
  const { data: plan, isLoading, error: loadError } = useBillingPlansRetrieve(billingPlanId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);

  const methods = useForm<BillingPlanFormInput, unknown, BillingPlanFormOutput>({
    resolver: zodResolver(billingPlanSchema),
    defaultValues: { ...BILLING_PLAN_DEFAULTS, condominium: scope.condominium },
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, remove, isSubmitting } = useBillingPlanSubmit(billingPlanId, scope, setError);

  useEffect(() => {
    if (plan) reset(billingPlanToForm(plan));
  }, [plan, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        <div id="plano" className="scroll-mt-20">
          <IdentificationSection isEdit={isEdit} />
        </div>
        <div id="itens" className="scroll-mt-20">
          <ItemsSection />
        </div>
        <FormActions
          isSubmitting={isSubmitting}
          danger={
            plan && (
              <ConfirmDeleteButton
                appearance="solid"
                title="Excluir plano de cobrança?"
                description={`O plano "${plan.name}" e os seus ${plan.items.length} itens serão excluídos. Esta ação não pode ser desfeita.`}
                onConfirm={remove}
              />
            )
          }
        >
          <Button type="button" variant="secondary" onClick={() => router.push(billingPlansUrl(scope))}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
