"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import {
  getDashboardRetrieveQueryKey,
  getUnitsListQueryKey,
  getUnitsRetrieveQueryKey,
  useUnitsRetrieve,
} from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  UNIT_DEFAULTS,
  unitSchema,
  unitToForm,
  type UnitFormInput,
  type UnitFormOutput,
} from "@/lib/schemas/unit";

import { unitsUrl } from "@/lib/unit-workspace";

import { BillingSection } from "./unit-form/BillingSection";
import { FractionsSection } from "./unit-form/FractionsSection";
import { IdentificationSection } from "./unit-form/IdentificationSection";
import { MetersSection } from "./unit-form/MetersSection";
import { useUnitSubmit } from "./unit-form/use-unit-submit";
import { UnitDeleteButton } from "./UnitDeleteButton";
import { UnitPeopleSection } from "./unit-people/UnitPeopleSection";

interface UnitFormProps {
  condominiumId: string;
  unitId?: string;
}

const FORM_ID = "unit-form";

/**
 * A página de uma unidade (cadastro novo ou edição): Dados gerais, Proprietário, Inquilino e Cobrança. Os campos de Dados gerais e
 * Cobrança são um só formulário (um Salvar); as seções de pessoas ficam no meio e têm o próprio formulário de vínculo, por isso o
 * `<form>` é um elemento vazio ao qual o botão Salvar se liga pelo `id`.
 */
export function UnitForm({ condominiumId, unitId }: UnitFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = unitId !== undefined;

  const { data: unit, isLoading, error: loadError } = useUnitsRetrieve(unitId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfNotFound(loadError);

  const methods = useForm<UnitFormInput, unknown, UnitFormOutput>({
    resolver: zodResolver(unitSchema),
    defaultValues: UNIT_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useUnitSubmit(condominiumId, unitId, setError);

  useEffect(() => {
    if (unit) reset(unitToForm(unit));
  }, [unit, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  const refreshUnit = () => {
    queryClient.invalidateQueries({ queryKey: getUnitsRetrieveQueryKey(unitId!) });
    queryClient.invalidateQueries({ queryKey: getUnitsListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
  };

  return (
    <FormProvider {...methods}>
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
      />
      <div className="space-y-8">
        <div id="dados-gerais" className="scroll-mt-20 space-y-4">
          <IdentificationSection condominiumId={condominiumId} />
          <FractionsSection condominiumId={condominiumId} />
        </div>
        <div id="proprietario" className="scroll-mt-20">
          <UnitPeopleSection unitId={unit?.id} role="owner" links={unit?.unit_people ?? []} onChanged={refreshUnit} />
        </div>
        <div id="inquilino" className="scroll-mt-20">
          <UnitPeopleSection unitId={unit?.id} role="tenant" links={unit?.unit_people ?? []} onChanged={refreshUnit} />
        </div>
        <div id="cobranca" className="scroll-mt-20 space-y-4">
          <BillingSection />
          <MetersSection />
        </div>
        <FormActions
          isSubmitting={isSubmitting}
          formId={FORM_ID}
          danger={unit && <UnitDeleteButton condominiumId={condominiumId} unitId={unit.id} name={unit.name} />}
        >
          <Button type="button" variant="secondary" onClick={() => router.push(unitsUrl(condominiumId))}>
            Cancelar
          </Button>
        </FormActions>
      </div>
    </FormProvider>
  );
}
