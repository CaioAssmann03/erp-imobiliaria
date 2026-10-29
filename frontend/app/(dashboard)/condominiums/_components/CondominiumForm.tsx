"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useCondominiumBillingRulesList, useCondominiumsRetrieve } from "@/lib/api/generated";
import { REVEAL_FORM_SECTION_EVENT } from "@/components/form/reveal-section";
import { parseFormSection, showFormSection, type FormSectionId } from "@/lib/condominium-sections";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  CONDOMINIUM_DEFAULTS,
  condominiumSchema,
  condominiumToForm,
  type CondominiumFormInput,
  type CondominiumFormOutput,
} from "@/lib/schemas/condominium";

import { DeleteCondominiumButton } from "./workspace/DeleteCondominiumButton";
import { AddressSection } from "./condominium-form/AddressSection";
import { AdjustmentSection } from "./condominium-form/AdjustmentSection";
import { ApportionmentCard } from "./condominium-form/ApportionmentCard";
import { ApportionmentCriteriaCard } from "./condominium-form/ApportionmentCriteriaCard";
import { BillingSection } from "./condominium-form/BillingSection";
import { FeeSection } from "./condominium-form/FeeSection";
import { IdentificationSection } from "./condominium-form/IdentificationSection";
import { useCondominiumSubmit } from "./condominium-form/use-condominium-submit";

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
  const section = parseFormSection(useSearchParams().get("section"));
  // Editando, uma seção por vez (a do menu da direita); cadastrando, tudo junto.
  const panel = (id: FormSectionId) => ({ "data-section": id, hidden: isEdit && section !== id });

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

  // O resumo de erros pede para abrir a seção de um campo que está fechado.
  useEffect(() => {
    const reveal = (event: Event) => showFormSection((event as CustomEvent<FormSectionId>).detail);
    window.addEventListener(REVEAL_FORM_SECTION_EVENT, reveal);
    return () => window.removeEventListener(REVEAL_FORM_SECTION_EVENT, reveal);
  }, []);

  // Salvar com erro: leva para a primeira seção que tem um campo inválido.
  const onInvalid = () => {
    toast.error("Corrija os campos destacados.");
    requestAnimationFrame(() => {
      const first = document.querySelector<HTMLElement>('[data-section] [aria-invalid="true"]');
      const id = first?.closest<HTMLElement>("[data-section]")?.dataset.section as FormSectionId | undefined;
      if (id && id !== section) showFormSection(id);
    });
  };

  if (isEdit && (isLoading || isLoadingBillingRules)) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, onInvalid)}
        className="space-y-4"
      >
        <div {...panel("identification")}>
          <IdentificationSection />
        </div>
        <div {...panel("address")}>
          <AddressSection mapsEmbedKey={mapsEmbedKey} />
        </div>
        <div {...panel("fee")}>
          <FeeSection />
        </div>
        <div {...panel("billing")}>
          <BillingSection condominiumId={condominiumId} />
        </div>
        <div {...panel("adjustment")}>
          <AdjustmentSection />
        </div>
        {isEdit && (
          <div {...panel("apportionment")} className="space-y-4">
            <ApportionmentCriteriaCard condominiumId={condominiumId} />
            <ApportionmentCard condominiumId={condominiumId} />
          </div>
        )}
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push("/condominiums")}>
            Cancelar
          </Button>
          {isEdit && condominium && <DeleteCondominiumButton condominiumId={condominiumId} name={condominium.name} />}
        </FormActions>
      </form>
    </FormProvider>
  );
}
