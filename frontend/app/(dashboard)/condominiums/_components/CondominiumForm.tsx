"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useCondominiumBillingRulesList, useCondominiumsRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  CONDOMINIUM_DEFAULTS,
  condominiumSchema,
  condominiumToForm,
  type CondominiumFormInput,
  type CondominiumFormOutput,
} from "@/lib/schemas/condominium";

import { AddressSection } from "./condominium-form/AddressSection";
import { AdjustmentSection } from "./condominium-form/AdjustmentSection";
import { ApportionmentCriteriaCard } from "./condominium-form/ApportionmentCriteriaCard";
import { BillingSection } from "./condominium-form/BillingSection";
import { FeeSection } from "./condominium-form/FeeSection";
import { IdentificationSection } from "./condominium-form/IdentificationSection";
import { useCondominiumSubmit } from "./condominium-form/use-condominium-submit";
import { CondominiumDeleteButton } from "./CondominiumDeleteButton";

export function CondominiumForm({
  condominiumId,
  mapsEmbedKey,
}: {
  condominiumId?: string;
  /** Chave da Maps Embed API, lida no servidor pela página; sem ela o endereço só ganha o link do mapa. */
  mapsEmbedKey?: string;
}) {
  const router = useRouter();
  const isEdit = condominiumId !== undefined;

  const { data: condominium, isLoading, error: loadError } = useCondominiumsRetrieve(condominiumId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfNotFound(loadError);

  const { data: billingRulesPage, isLoading: isLoadingBillingRules } = useCondominiumBillingRulesList(
    { condominium: condominiumId, limit: 1 },
    { query: { enabled: isEdit } }
  );
  const billingRules = billingRulesPage?.results[0];

  const methods = useForm<CondominiumFormInput, unknown, CondominiumFormOutput>({
    resolver: zodResolver(condominiumSchema),
    defaultValues: CONDOMINIUM_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useCondominiumSubmit(condominiumId, billingRules?.id, setError);

  useEffect(() => {
    if (condominium && !isLoadingBillingRules) reset(condominiumToForm(condominium, billingRules));
  }, [condominium, billingRules, isLoadingBillingRules, reset]);

  if (isEdit && (isLoading || isLoadingBillingRules)) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <div id="dados-gerais" className="scroll-mt-20 space-y-4">
          <IdentificationSection />
          <AddressSection mapsEmbedKey={mapsEmbedKey} />
        </div>
        <div id="taxa-e-cobranca" className="scroll-mt-20 space-y-4">
          <FeeSection />
          <BillingSection condominiumId={condominiumId} />
          <AdjustmentSection />
          {isEdit && <ApportionmentCriteriaCard condominiumId={condominiumId} />}
        </div>
        <FormActions
          isSubmitting={isSubmitting}
          danger={condominium && <CondominiumDeleteButton condominiumId={condominium.id} name={condominium.name} />}
        >
          <Button type="button" variant="secondary" onClick={() => router.push("/condominiums")}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
