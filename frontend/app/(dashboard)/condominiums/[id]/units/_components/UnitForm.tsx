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
  getUnitsRetrieveQueryKey,
  useUnitsRetrieve,
} from "@/lib/api/generated";
import {
  UNIT_DEFAULTS,
  unitSchema,
  unitToForm,
  type UnitFormInput,
  type UnitFormOutput,
} from "@/lib/schemas/unit";

import { FractionsSection } from "./unit-form/FractionsSection";
import { IdentificationSection } from "./unit-form/IdentificationSection";
import { MetersSection } from "./unit-form/MetersSection";
import { useUnitSubmit } from "./unit-form/use-unit-submit";
import { UnitPeopleSection } from "./unit-people/UnitPeopleSection";

interface UnitFormProps {
  condominiumId: string;
  unitId?: string;
  /** Para onde voltar ao cancelar ou salvar; padrão: unidades do condomínio. */
  listUrl?: string;
}

/** Cadastro e edição de unidade. Na edição, também gerencia proprietários e locatários. */
export function UnitForm({ condominiumId, unitId, listUrl }: UnitFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = unitId !== undefined;

  const { data: unit, isLoading } = useUnitsRetrieve(unitId ?? "", {
    query: { enabled: isEdit },
  });

  const methods = useForm<UnitFormInput, unknown, UnitFormOutput>({
    resolver: zodResolver(unitSchema),
    defaultValues: UNIT_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useUnitSubmit(condominiumId, unitId, setError, listUrl);

  useEffect(() => {
    if (unit) reset(unitToForm(unit));
  }, [unit, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;

  const refreshUnit = () => {
    queryClient.invalidateQueries({ queryKey: getUnitsRetrieveQueryKey(unitId!) });
    queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
  };

  return (
    <div className="space-y-4">
      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
          className="space-y-4"
        >
          <IdentificationSection condominiumId={condominiumId} />
          <FractionsSection />
          <MetersSection />
          <FormActions isSubmitting={isSubmitting}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(listUrl ?? `/condominiums/${condominiumId}/units`)}
            >
              Cancelar
            </Button>
          </FormActions>
        </form>
      </FormProvider>

      {isEdit && unit && (
        <UnitPeopleSection unitId={unit.id} links={unit.unit_people} onChanged={refreshUnit} />
      )}
    </div>
  );
}
