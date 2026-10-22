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
import { ApportionmentCard } from "./condominium-form/ApportionmentCard";
import { BillingSection } from "./condominium-form/BillingSection";
import { DeleteCondominiumCard } from "./condominium-form/DeleteCondominiumCard";
import { FeeSection } from "./condominium-form/FeeSection";
import { IdentificationSection } from "./condominium-form/IdentificationSection";
import { useCondominiumSubmit } from "./condominium-form/use-condominium-submit";

export function CondominiumForm({
  condominiumId,
  mapsEmbedKey,
}: {
  condominiumId?: string;
  /** Chave da Maps Embed API, lida no servidor pela página; sem ela o formulário usa o mapa do Google sem chave. */
  mapsEmbedKey?: string;
}) {
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

  // Editando, descarta o que foi digitado e volta ao que está salvo; criando, volta para a lista.
  const discard = () => (condominium ? reset(condominiumToForm(condominium)) : router.push("/condominiums"));

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        {/* Os grupos levam o `id` que o menu das seções (SectionMenu) usa para rolar até eles. */}
        <div id="dados-gerais" className="scroll-mt-24 space-y-4">
          <IdentificationSection />
          <AddressSection mapsEmbedKey={mapsEmbedKey} />
          {isEdit && <ApportionmentCard condominiumId={condominiumId} />}
        </div>
        <div id="taxa-de-administracao" className="scroll-mt-24 space-y-4">
          <FeeSection />
          <AdjustmentSection />
        </div>
        <div id="dados-de-cobranca" className="scroll-mt-24 space-y-4">
          <BillingSection condominiumId={condominiumId} />
        </div>
        {isEdit && condominium && (
          <div id="configuracoes" className="scroll-mt-24 space-y-4">
            <DeleteCondominiumCard condominiumId={condominiumId} name={condominium.name} />
          </div>
        )}
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={discard}>
            {isEdit ? "Descartar" : "Cancelar"}
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
