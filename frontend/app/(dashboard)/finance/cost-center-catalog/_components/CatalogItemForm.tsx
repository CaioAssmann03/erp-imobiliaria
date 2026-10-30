"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { CheckboxField, TextField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useCostCenterCatalogRetrieve } from "@/lib/api/generated";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";
import { throwIfPageError } from "@/lib/query/page-error";
import {
  COST_CENTER_CATALOG_ITEM_DEFAULTS,
  costCenterCatalogItemSchema,
  costCenterCatalogItemToForm,
  type CostCenterCatalogItemFormInput,
  type CostCenterCatalogItemFormOutput,
} from "@/lib/schemas/cost-center-catalog-item";
import { toast } from "@/lib/errors/toast";

import { CatalogCondominiums } from "./CatalogCondominiums";
import { CatalogDeleteButton } from "./CatalogDeleteButton";
import { useCatalogItemSubmit } from "./catalog-form/use-catalog-item-submit";

/** Cadastro e edição de uma sub-conta do catálogo (código e nome valem para todos os condomínios que a usam). */
export function CatalogItemForm({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const isEdit = itemId !== undefined;
  const { data: item, isLoading, error: loadError } = useCostCenterCatalogRetrieve(itemId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);

  const methods = useForm<CostCenterCatalogItemFormInput, unknown, CostCenterCatalogItemFormOutput>({
    resolver: zodResolver(costCenterCatalogItemSchema),
    defaultValues: COST_CENTER_CATALOG_ITEM_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useCatalogItemSubmit(itemId, setError);

  useEffect(() => {
    if (item) reset(costCenterCatalogItemToForm(item));
  }, [item, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        <div id="identificacao" className="scroll-mt-20">
        <FormSection
          title="Identificação"
          description={
            isEdit && item && item.cost_center_count > 0
              ? `Usada por ${item.cost_center_count} condomínio(s): mudar o nome ou o código muda em todos.`
              : undefined
          }
        >
          <TextField
            name="code"
            label="Código"
            inputMode="numeric"
            maxLength={4}
            placeholder="Automático"
            hint="Número pelo qual a equipe conhece a sub-conta (0 é a Conta Normal). Em branco, o sistema dá o próximo livre."
            autoComplete="off"
          />
          <TextField name="name" label="Sub-conta" required maxLength={120} placeholder="Ex.: Fundo de reserva" autoComplete="off" />
          <FieldRow>
            <CheckboxField name="active" label="Cadastro ativo" hint="Uma sub-conta inativa não pode ser escolhida para novos condomínios; os que já a usam continuam." />
          </FieldRow>
        </FormSection>
        </div>
        {item && (
          <div id="condominios" className="scroll-mt-20">
            <CatalogCondominiums key={item.id} itemId={item.id} />
          </div>
        )}
        <FormActions isSubmitting={isSubmitting} danger={item && <CatalogDeleteButton itemId={item.id} name={item.name} />}>
          <Button type="button" variant="secondary" onClick={() => router.push(catalogUrl())}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
