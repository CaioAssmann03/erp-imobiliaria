"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useCondominiumsList, useCostCentersRetrieve } from "@/lib/api/generated";
import { condominiumUrl } from "@/lib/condominium-registry";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  COST_CENTER_DEFAULTS,
  costCenterSchema,
  costCenterToForm,
  type CostCenterFormInput,
  type CostCenterFormOutput,
} from "@/lib/schemas/cost-center";

import { useCostCenterSubmit } from "./cost-center-form/use-cost-center-submit";

/** Cadastro e edição de sub-conta. O condomínio só é escolhido no cadastro, e não quando o cadastro parte de um condomínio. */
export function CostCenterForm({
  costCenterId,
  condominiumId,
}: {
  costCenterId?: string;
  /** Cadastro a partir de um condomínio: já vem escolhido e o campo some. */
  condominiumId?: string;
}) {
  const router = useRouter();
  const isEdit = costCenterId !== undefined;

  const { data: costCenter, isLoading, error: loadError } = useCostCentersRetrieve(costCenterId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfNotFound(loadError);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const methods = useForm<CostCenterFormInput, unknown, CostCenterFormOutput>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: { ...COST_CENTER_DEFAULTS, condominium: condominiumId ?? "" },
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useCostCenterSubmit(costCenterId, setError);
  const returnUrl = costCenter ? condominiumUrl(costCenter.condominium, "sub-contas") : condominiumId ? condominiumUrl(condominiumId, "sub-contas") : "/condominiums";

  useEffect(() => {
    if (costCenter) reset(costCenterToForm(costCenter));
  }, [costCenter, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <FormSection title="Identificação">
          {!isEdit && !condominiumId && (
            <SelectField
              name="condominium"
              label="Condomínio"
              required
              placeholder="Selecione"
              options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <TextField
            name="code"
            label="Código"
            inputMode="numeric"
            maxLength={4}
            placeholder="Automático"
            hint="Número pelo qual a equipe conhece a sub-conta (0000 é a Conta Normal). Em branco, o sistema dá o próximo livre."
            autoComplete="off"
          />
          <TextField name="name" label="Sub-conta" required maxLength={120} placeholder="Ex.: Fundo de reserva" autoComplete="off" />
          <FieldRow>
            <CheckboxField name="active" label="Cadastro ativo" />
          </FieldRow>
        </FormSection>
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push(returnUrl)}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
