"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useCondominiumsRetrieve } from "@/lib/api/generated";
import {
  CONDOMINIUM_DEFAULTS,
  condominiumSchema,
  condominiumToForm,
  type CondominiumFormInput,
  type CondominiumFormOutput,
} from "@/lib/schemas/condominium";

import { AddressSection } from "./condominium-form/AddressSection";
import { AdjustmentSection } from "./condominium-form/AdjustmentSection";
import { BillingSection } from "./condominium-form/BillingSection";
import { FeeSection } from "./condominium-form/FeeSection";
import { IdentificationSection } from "./condominium-form/IdentificationSection";
import { useCondominiumSubmit } from "./condominium-form/use-condominium-submit";

/** Cadastro e edição de condomínio: carrega, valida e compõe as seções. */
export function CondominiumForm({ condominiumId }: { condominiumId?: string }) {
  const router = useRouter();
  const isEdit = condominiumId !== undefined;

  const { data: condominium, isLoading } = useCondominiumsRetrieve(condominiumId ?? "", {
    query: { enabled: isEdit },
  });

  const methods = useForm<CondominiumFormInput, unknown, CondominiumFormOutput>({
    resolver: zodResolver(condominiumSchema),
    defaultValues: CONDOMINIUM_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useCondominiumSubmit(condominiumId, setError);

  useEffect(() => {
    if (condominium) reset(condominiumToForm(condominium));
  }, [condominium, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <IdentificationSection isEdit={isEdit} />
        <AddressSection />
        <FeeSection />
        <BillingSection />
        <AdjustmentSection />
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push("/condominiums")}>
            Cancelar
          </Button>
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/condominiums/${condominiumId}/units`)}
            >
              Ver unidades
            </Button>
          )}
        </FormActions>
      </form>
    </FormProvider>
  );
}
