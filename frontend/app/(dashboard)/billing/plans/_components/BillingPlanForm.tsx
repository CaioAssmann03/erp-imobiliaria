"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useBillingPlansRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  BILLING_PLAN_DEFAULTS,
  billingPlanSchema,
  billingPlanToForm,
  type BillingPlanFormInput,
  type BillingPlanFormOutput,
} from "@/lib/schemas/billing-plan";

import { IdentificationSection } from "./billing-plan-form/IdentificationSection";
import { ItemsSection } from "./billing-plan-form/ItemsSection";
import { BILLING_PLANS_URL, useBillingPlanSubmit } from "./billing-plan-form/use-billing-plan-submit";
import { ValiditySection } from "./billing-plan-form/ValiditySection";

/** Cadastro e edição de um plano de cobrança com os seus itens (a lista inteira é enviada junto). */
export function BillingPlanForm({ billingPlanId }: { billingPlanId?: string }) {
  const router = useRouter();
  const isEdit = billingPlanId !== undefined;
  const { data: plan, isLoading, error: loadError } = useBillingPlansRetrieve(billingPlanId ?? "", { query: { enabled: isEdit } });
  throwIfNotFound(loadError);

  const methods = useForm<BillingPlanFormInput, unknown, BillingPlanFormOutput>({
    resolver: zodResolver(billingPlanSchema),
    defaultValues: BILLING_PLAN_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useBillingPlanSubmit(billingPlanId, setError);

  useEffect(() => {
    if (plan) reset(billingPlanToForm(plan));
  }, [plan, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        <IdentificationSection isEdit={isEdit} />
        <ValiditySection />
        <ItemsSection />
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push(BILLING_PLANS_URL)}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
