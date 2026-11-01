"use client";

import { useWatch } from "react-hook-form";

import { CheckboxField, SearchSelectField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";

import { FormSkeleton } from "@/components/form/FormSkeleton";

import {
  useCondominiumsList,
  useCostCenterCatalogList,
  useCostCentersRetrieve,
} from "@/lib/api/generated";
import { formatCode } from "@/lib/format/format";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";
import { throwIfPageError } from "@/lib/query/page-error";
import { COST_CENTER_DEFAULTS, costCenterSchema, costCenterToForm } from "@/lib/schemas/cost-center";

import { CostCenterDeleteButton } from "./CostCenterDeleteButton";
import { useCostCenterSubmit } from "./cost-center-form/use-cost-center-submit";
import { RecordForm } from "@/components/form/RecordForm";

import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de sub-conta de um condomínio: no cadastro escolhe-se uma do catálogo da administradora; na edição só muda se está ativa. */
export function CostCenterForm({
  costCenterId,
  condominiumId,
}: {
  costCenterId?: string;
  /** Cadastro a partir de um condomínio: já vem escolhido e o campo some. */
  condominiumId?: string;
}) {
  const isEdit = costCenterId !== undefined;

  const { data: costCenter, isLoading, error: loadError } = useCostCentersRetrieve(costCenterId ?? "", {
    query: { enabled: isEdit },
  });
  throwIfPageError(loadError);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const methods = useRecordForm({
    schema: costCenterSchema,
    defaults: { ...COST_CENTER_DEFAULTS, condominium: condominiumId ?? "" },
    record: costCenter,
    toForm: costCenterToForm,
  });
  // O catálogo (só as ativas) menos as que o condomínio escolhido já usa: quem tira é a API (`unused_by_condominium`).
  const watchedCondominium = useWatch({ control: methods.control, name: "condominium" });
  const chosenCondominium = condominiumId ?? watchedCondominium;
  const { data: catalog } = useCostCenterCatalogList(
    { active: true, limit: 100, ...(chosenCondominium ? { unused_by_condominium: chosenCondominium } : {}) },
    { query: { enabled: !isEdit } }
  );
  const catalogOptions = (catalog?.results ?? []).map((item) => ({ value: item.id, label: `${formatCode(item.code ?? 0)} · ${item.name}` }));
  const { submit, isSubmitting } = useCostCenterSubmit(costCenterId, methods.setError);
  const returnUrl = costCenter ? condominiumPageUrl(costCenter.condominium, "cost-centers") : condominiumId ? condominiumPageUrl(condominiumId, "cost-centers") : "/condominiums";

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={returnUrl}
      danger={costCenter && <CostCenterDeleteButton condominiumId={costCenter.condominium} costCenterId={costCenter.id} name={costCenter.name} />}
    >
      <FormSection
        title="Sub-conta"
        description={
          isEdit
            ? "O código e o nome vêm do catálogo da administradora; para mudá-los, edite a sub-conta lá."
            : "Escolha, entre as sub-contas do catálogo da administradora, a que este condomínio vai usar."
        }
      >
        {!isEdit && !condominiumId && (
          <SearchSelectField
            name="condominium"
            label="Condomínio"
            required
            placeholder="Selecione"
            options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
        )}
        {isEdit ? (
          <p className="rounded-control bg-surface-muted px-4 py-2 text-body">
            <span className="tabular-nums text-ink-soft">{costCenter ? formatCode(costCenter.code) : ""}</span>
            {" · "}
            {costCenter?.name}
          </p>
        ) : (
          <SearchSelectField
            name="catalog_item"
            label="Sub-conta do catálogo"
            required
            placeholder="Selecione"
            options={catalogOptions}
            hint={
              catalogOptions.length === 0
                ? "Não há sub-contas livres no catálogo para este condomínio. Cadastre-as em Financeiro → Catálogo de sub-contas."
                : undefined
            }
          />
        )}
        <FieldRow>
          <CheckboxField name="active" label="Cadastro ativo" />
        </FieldRow>
      </FormSection>
    </RecordForm>
  );
}
