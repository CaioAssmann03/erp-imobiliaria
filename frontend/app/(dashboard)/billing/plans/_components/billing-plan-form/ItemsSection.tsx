"use client";

import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { EMPTY_PLAN_ITEM, type BillingPlanFormInput } from "@/lib/schemas/billing-plan";

import { BillingPlanItemFields } from "./BillingPlanItemFields";

/**
 * Itens do plano, na ordem em que aparecem no boleto. Só editáveis depois de escolher o condomínio. Cada item é um resumo que abre para editar; ficam abertos sozinhos
 * os que ainda não têm sub-conta (os novos) e os que têm erro, para que nada fique escondido.
 */
export function ItemsSection() {
  const { fields, append, remove, move } = useFieldArray<BillingPlanFormInput, "items">({ name: "items" });
  const condominium = useWatch({ name: "condominium" }) as string;
  const items = (useWatch({ name: "items" }) as BillingPlanFormInput["items"] | undefined) ?? [];
  const { formState } = useFormContext<BillingPlanFormInput>();
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());

  const needsAttention = (index: number) => !items[index]?.cost_center || Boolean(formState.errors.items?.[index]);
  const toggle = (id: string) =>
    setOpened((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <FormSection title="Itens" hint="A ordem desta lista é a ordem das linhas no boleto.">
      {condominium === "" ? (
        <p className="rounded-panel bg-surface-muted px-4 py-2.5 text-body text-ink-soft" role="note">
          Escolha o condomínio para configurar os itens.
        </p>
      ) : (
        <>
          {fields.map((field, index) => (
            <BillingPlanItemFields
              key={field.id}
              index={index}
              condominium={condominium}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              canRemove={fields.length > 1}
              open={needsAttention(index) || opened.has(field.id)}
              onToggle={() => toggle(field.id)}
              onMove={(delta) => move(index, index + delta)}
              onRemove={() => remove(index)}
            />
          ))}
          <div>
            <Button type="button" variant="secondary" onClick={() => append({ ...EMPTY_PLAN_ITEM })}>
              Adicionar item
            </Button>
          </div>
        </>
      )}
    </FormSection>
  );
}
