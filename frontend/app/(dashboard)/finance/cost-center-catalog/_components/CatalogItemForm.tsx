"use client";

import { CheckboxField, TextField } from "@/components/form/fields";

import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";

import { useCostCenterCatalogRetrieve } from "@/lib/api/generated";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";
import { throwIfPageError } from "@/lib/query/page-error";
import {
  COST_CENTER_CATALOG_ITEM_DEFAULTS,
  costCenterCatalogItemSchema,
  costCenterCatalogItemToForm,
} from "@/lib/schemas/cost-center-catalog-item";

import { CatalogCondominiums } from "./CatalogCondominiums";
import { CatalogDeleteButton } from "./CatalogDeleteButton";
import { useCatalogItemSubmit } from "./catalog-form/use-catalog-item-submit";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de uma sub-conta do catálogo (código e nome valem para todos os condomínios que a usam). */
export function CatalogItemForm({ itemId }: { itemId?: string }) {
  const isEdit = itemId !== undefined;
  const { data: item, isLoading, error: loadError } = useCostCenterCatalogRetrieve(itemId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);

  const methods = useRecordForm({
    schema: costCenterCatalogItemSchema,
    defaults: COST_CENTER_CATALOG_ITEM_DEFAULTS,
    record: item,
    toForm: costCenterCatalogItemToForm,
  });
  const { submit, isSubmitting } = useCatalogItemSubmit(itemId, methods.setError);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={catalogUrl()}
      danger={item && <CatalogDeleteButton itemId={item.id} name={item.name} />}
    >
      <SectionAnchor id="identificacao">
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
      </SectionAnchor>
      {item && (
        <SectionAnchor id="condominios">
          <CatalogCondominiums key={item.id} itemId={item.id} />
        </SectionAnchor>
      )}
    </RecordForm>
  );
}
