"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { useUnitsList } from "@/lib/api/generated";
import { maskSignedMoney } from "@/lib/masks";
import { inputClass } from "@/lib/ui";

interface SelectedUnit {
  unit: string;
  amount: string;
}

/**
 * As unidades do lançamento: marque as que pagam (ou todas). No rateio individual cada uma pode ter um valor próprio;
 * em branco vale o valor do lançamento.
 */
export function UnitsPicker({ condominium }: { condominium: string }) {
  const { setValue, formState } = useFormContext();
  const selected = (useWatch({ name: "units" }) as SelectedUnit[] | undefined) ?? [];
  const allocation = useWatch({ name: "allocation" }) as string;
  const { data, isLoading } = useUnitsList({ condominium, active: true, limit: 100 }, { query: { enabled: condominium !== "" } });
  const units = data?.results ?? [];
  const error = formState.errors.units?.message as string | undefined;

  const write = (next: SelectedUnit[]) => setValue("units", next, { shouldDirty: true, shouldValidate: true });
  const isSelected = (id: string) => selected.some((item) => item.unit === id);
  const toggle = (id: string) => write(isSelected(id) ? selected.filter((item) => item.unit !== id) : [...selected, { unit: id, amount: "" }]);
  const setAmount = (id: string, amount: string) => write(selected.map((item) => (item.unit === id ? { ...item, amount } : item)));
  const allSelected = units.length > 0 && units.every((unit) => isSelected(unit.id));

  return (
    <fieldset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-caption font-medium text-ink-soft">
          Unidades <span className="text-brand" aria-hidden="true">*</span>
          <span className="ml-2 font-normal">{selected.length} selecionada(s)</span>
        </legend>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={units.length === 0}
          onClick={() => write(allSelected ? [] : units.map((unit) => selected.find((item) => item.unit === unit.id) ?? { unit: unit.id, amount: "" }))}
        >
          {allSelected ? "Limpar" : "Selecionar todas"}
        </Button>
      </div>
      {condominium === "" ? (
        <p className="text-caption text-ink-soft">Escolha o condomínio para ver as unidades.</p>
      ) : isLoading ? (
        <p className="text-caption text-ink-soft">Carregando unidades…</p>
      ) : units.length === 0 ? (
        <p className="text-caption text-ink-soft">Este condomínio não tem unidades ativas.</p>
      ) : (
        <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-control bg-surface-muted/40">
          {units.map((unit) => {
            const current = selected.find((item) => item.unit === unit.id);
            return (
              <li key={unit.id} className="flex items-center gap-3 px-3 py-1.5">
                <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-body">
                  <input type="checkbox" className="size-4 cursor-pointer accent-brand" checked={current !== undefined} onChange={() => toggle(unit.id)} />
                  Unidade {unit.name}
                </label>
                {current && allocation === "individual" && (
                  <input
                    aria-label={`Valor da unidade ${unit.name}`}
                    inputMode="decimal"
                    placeholder="Valor do lançamento"
                    className={`${inputClass} h-8 w-40`}
                    value={current.amount}
                    onChange={(event) => setAmount(unit.id, maskSignedMoney(event.target.value))}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p role={error ? "alert" : undefined} className="min-h-4 text-caption text-danger">
        {error}
      </p>
    </fieldset>
  );
}
