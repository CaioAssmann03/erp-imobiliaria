"use client";

import { FormSection } from "@/components/form/FormSection";
import { useCondominiumsApportionment } from "@/lib/api/generated";
import { cn } from "@/lib/utils";

const total = (value: string) =>
  Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 });

/**
 * A soma das frações de cada critério de rateio entre as unidades ativas do condomínio (só leitura): um critério em
 * uso tem que fechar em 1. O backend diz qual não fecha, com a mesma regra da pendência do painel.
 */
export function ApportionmentCard({ condominiumId }: { condominiumId: string }) {
  const { data } = useCondominiumsApportionment(condominiumId);
  if (!data) return null;

  const units = data.active_units;

  return (
    <FormSection
      title="Frações ideais"
      description={`${units} ${units === 1 ? "unidade ativa" : "unidades ativas"}. Cada critério em uso precisa somar 1; as frações de cada unidade são editadas na própria unidade.`}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.criteria.map((fraction) => {
          const unused = !fraction.is_inconsistent && Number(fraction.total) === 0;
          return (
            <li
              key={fraction.criterion}
              className={cn(
                "rounded-panel px-4 py-2.5",
                fraction.is_inconsistent ? "bg-danger-soft" : "bg-surface-muted"
              )}
            >
              <div className="text-caption text-ink-soft">{fraction.name}</div>
              <div className="font-medium tabular-nums">{total(fraction.total)}</div>
              <div
                className={cn(
                  "text-caption",
                  fraction.is_inconsistent ? "text-danger" : unused ? "text-ink-faint" : "text-success"
                )}
              >
                {fraction.is_inconsistent ? "Não fecha 1" : unused ? "Sem uso" : "Fecha 1"}
              </div>
            </li>
          );
        })}
      </ul>
    </FormSection>
  );
}
