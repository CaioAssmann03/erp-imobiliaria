"use client";

import { ChevronDown, ChevronRight, ChevronUp, Trash2 } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { SearchSelectField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import {
  useBillingEventsList,
  useCondominiumApportionmentCriteriaList,
  useCostCentersList,
  useEntryTemplatesList,
} from "@/lib/api/generated";
import { needsAmount, needsApportionmentCriterion, needsUnitValueField } from "@/lib/billing/billing-plan-payload";
import { maskMoney } from "@/lib/format/masks";
import { CALCULATION_KINDS, UNIT_VALUE_FIELDS } from "@/lib/schemas/billing-plan";
import { cn } from "@/lib/utils";

interface BillingPlanItemFieldsProps {
  index: number;
  condominium: string;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  /** Aberto para editar; fechado, o item é só o resumo de uma linha. */
  open: boolean;
  onToggle: () => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

/**
 * Um item do plano. Fechado é um resumo (o que o boleto mostra, a sub-conta, o cálculo e o valor); aberto, a descrição, a sub-conta e o modelo (do condomínio
 * do plano) e o tipo de cálculo com só os seus campos. Mover e remover são ícones, sempre à mão.
 */
export function BillingPlanItemFields({ index, condominium, isFirst, isLast, canRemove, open, onToggle, onMove, onRemove }: BillingPlanItemFieldsProps) {
  const { setValue } = useFormContext();
  const prefix = `items.${index}`;
  const [costCenter, kind, event, description, amount] = useWatch({
    name: [`${prefix}.cost_center`, `${prefix}.calculation_kind`, `${prefix}.event`, `${prefix}.description`, `${prefix}.amount`],
  }) as [string, string, string, string, string];
  const { data: events } = useBillingEventsList({ active: true, credits_company: false, limit: 100 });

  const { data: costCenters } = useCostCentersList({ condominium, active: true, limit: 100 });
  const { data: entryTemplates } = useEntryTemplatesList(
    { cost_center: costCenter, active: true, limit: 100 },
    { query: { enabled: costCenter !== "" } }
  );
  const { data: criteria } = useCondominiumApportionmentCriteriaList(
    { condominium, limit: 100 },
    { query: { enabled: needsApportionmentCriterion(kind) } }
  );
  const label = `item ${index + 1}`;

  const eventName = events?.results.find((item) => item.id === event)?.name;
  const title = [eventName, description].filter(Boolean).join(" - ") || "Sem descrição";
  const costCenterName = costCenters?.results.find((item) => item.id === costCenter)?.name;
  const kindLabel = CALCULATION_KINDS.find((item) => item.value === kind)?.label;
  const subtitle = [costCenterName, kindLabel].filter(Boolean).join(" · ");

  return (
    <div className="rounded-panel bg-surface-muted/40 px-4 py-3">
      <div className="flex items-center gap-1">
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 rounded-control py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronRight aria-hidden className={cn("size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-90")} />
          <span className="shrink-0 text-caption font-medium text-ink-soft">Item {index + 1}</span>
          {!open && (
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-body font-medium">{title}</span>
                {amount && <span className="shrink-0 text-caption tabular-nums text-ink-soft">R$ {amount}</span>}
              </span>
              {subtitle && <span className="block truncate text-caption text-ink-soft">{subtitle}</span>}
            </span>
          )}
        </button>
        <div className="flex shrink-0 items-center">
          <Button type="button" variant="ghost" size="icon" disabled={isFirst} aria-label={`Mover ${label} para cima`} onClick={() => onMove(-1)}>
            <ChevronUp className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={isLast} aria-label={`Mover ${label} para baixo`} onClick={() => onMove(1)}>
            <ChevronDown className="size-4" />
          </Button>
          {canRemove && (
            <Button type="button" variant="ghost" size="icon" className="text-ink-soft hover:text-danger" aria-label={`Remover ${label}`} onClick={onRemove}>
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
      <FieldRow>
        <SearchSelectField
          name={`${prefix}.event`}
          label="Evento"
          placeholder="Sem evento"
          hint="O boleto abre a linha com o código e o nome do evento (0052-CONDOMINIO). Cadastre os eventos em Configurações."
          options={(events?.results ?? []).map((item) => ({ value: item.id, label: `(${item.code}) ${item.name}` }))}
        />
        <TextField
          name={`${prefix}.description`}
          label="Descrição no boleto"
          required={!event}
          maxLength={120}
          placeholder={event ? "Vem depois do evento" : "A linha inteira do boleto"}
          autoComplete="off"
        />
      </FieldRow>
      <FieldRow>
        <SearchSelectField
          name={`${prefix}.cost_center`}
          label="Sub-conta"
          required
          placeholder="Selecione"
          onValueChange={() => setValue(`${prefix}.entry_template`, "", { shouldDirty: true })}
          options={(costCenters?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
        <SearchSelectField
          name={`${prefix}.entry_template`}
          label="Modelo de lançamento"
          required
          placeholder={costCenter ? "Selecione" : "Escolha a sub-conta"}
          disabled={!costCenter}
          options={(entryTemplates?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      </FieldRow>
      <FieldRow columns={needsApportionmentCriterion(kind) ? 3 : 2}>
        <SelectField name={`${prefix}.calculation_kind`} label="Cálculo" required options={CALCULATION_KINDS} />
        {needsAmount(kind) && (
          <TextField
            name={`${prefix}.amount`}
            label={needsApportionmentCriterion(kind) ? "Total do condomínio (R$)" : "Valor por unidade (R$)"}
            required
            inputMode="numeric"
            placeholder="0,00"
            mask={(value) => maskMoney(value, 12)}
          />
        )}
        {needsUnitValueField(kind) && (
          <SelectField name={`${prefix}.unit_value_field`} label="Valor lido da unidade" required placeholder="Selecione" options={UNIT_VALUE_FIELDS} />
        )}
        {needsApportionmentCriterion(kind) && (
          <SearchSelectField
            name={`${prefix}.apportionment_criterion`}
            label="Critério de rateio"
            required
            placeholder="Selecione"
            hint="O total é dividido entre as unidades pela fração de cada uma neste critério, que precisa fechar em 1."
            options={(criteria?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
        )}
      </FieldRow>
        </div>
      )}
    </div>
  );
}
