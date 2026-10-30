"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { DateField, MonthField, SearchSelectField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { useCondominiumsList, useCostCentersList, useEntryTemplatesList } from "@/lib/api/generated";
import { maskMoney } from "@/lib/masks";
import { ENTRY_KINDS } from "@/lib/schemas/entry-batch";

/** Um lançamento do lote: condomínio, modelo e sub-conta (que dependem dele), valor, datas e descrição. */
export function EntryLineFields({
  index,
  canRemove,
  onRemove,
}: {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { setValue } = useFormContext();
  const prefix = `lines.${index}`;
  const condominium = useWatch({ name: `${prefix}.condominium` }) as string;

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: costCenters } = useCostCentersList(
    { condominium, active: true, limit: 100 },
    { query: { enabled: condominium !== "" } }
  );
  const { data: entryTemplates } = useEntryTemplatesList(
    { condominium, active: true, limit: 100 },
    { query: { enabled: condominium !== "" } }
  );

  // O modelo traz a sub-conta padrão (pode ser trocada depois).
  const chooseTemplate = (templateId: string) => {
    const template = entryTemplates?.results.find((item) => item.id === templateId);
    if (template) setValue(`${prefix}.cost_center`, template.cost_center, { shouldDirty: true, shouldValidate: true });
  };
  const chooseCondominium = () => {
    setValue(`${prefix}.entry_template`, "", { shouldDirty: true });
    setValue(`${prefix}.cost_center`, "", { shouldDirty: true });
  };

  return (
    <div className="space-y-3 rounded-panel bg-surface-muted/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-caption font-medium uppercase tracking-wide text-ink-soft">Lançamento {index + 1}</h3>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" className="text-ink-soft hover:text-danger" onClick={onRemove}>
            Remover
          </Button>
        )}
      </div>
      <FieldRow columns={3}>
        <SearchSelectField
          name={`${prefix}.condominium`}
          label="Condomínio"
          required
          placeholder="Selecione"
          onValueChange={chooseCondominium}
          options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
        <SearchSelectField
          name={`${prefix}.entry_template`}
          label="Modelo de lançamento"
          required
          placeholder={condominium ? "Selecione" : "Escolha o condomínio"}
          disabled={!condominium}
          onValueChange={chooseTemplate}
          options={(entryTemplates?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
        <SearchSelectField
          name={`${prefix}.cost_center`}
          label="Sub-conta"
          required
          placeholder={condominium ? "Selecione" : "Escolha o condomínio"}
          disabled={!condominium}
          options={(costCenters?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      </FieldRow>
      <FieldRow template="repeat(4, minmax(0, 1fr))">
        <SelectField name={`${prefix}.kind`} label="Tipo" required options={ENTRY_KINDS} />
        <TextField
          name={`${prefix}.amount`}
          label="Valor"
          required
          inputMode="numeric"
          placeholder="0,00"
          mask={(value) => maskMoney(value, 12)}
        />
        <DateField name={`${prefix}.entry_date`} label="Data" required />
        <MonthField name={`${prefix}.competence_month`} label="Competência" required valueFormat="iso" />
      </FieldRow>
      <TextField name={`${prefix}.description`} label="Descrição" required maxLength={255} autoComplete="off" />
    </div>
  );
}
