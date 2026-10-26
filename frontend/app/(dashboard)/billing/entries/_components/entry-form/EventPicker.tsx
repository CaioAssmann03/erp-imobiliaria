"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { SelectField } from "@/components/form/fields";
import { inputClass } from "@/lib/ui";
import { useBillingEventsList } from "@/lib/api/generated";

/**
 * O evento pelo código (quem lança sabe que 250 é "Limpeza do condomínio") ou pela lista. Escolhê-lo preenche a
 * descrição do boleto; a descrição digitada vem depois dele ("Limpeza do condomínio - 10/2026").
 */
export function EventPicker() {
  const { setValue } = useFormContext();
  const event = useWatch({ name: "event" }) as string;
  const { data } = useBillingEventsList({ active: true, limit: 100 });
  const events = data?.results ?? [];
  const selected = events.find((item) => item.id === event);

  return (
    <div className="grid grid-cols-[6rem_1fr] gap-x-3">
      <div className="flex flex-col">
        <label htmlFor="event-code" className="mb-1.5 text-caption font-medium text-ink-soft">
          Cód.
        </label>
        <input
          id="event-code"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ex.: 250"
          className={inputClass}
          key={selected?.id ?? "none"}
          defaultValue={selected ? String(selected.code) : ""}
          onChange={(inputEvent) => {
            const match = events.find((item) => String(item.code) === inputEvent.target.value.trim());
            if (match) setValue("event", match.id, { shouldDirty: true });
            else if (inputEvent.target.value.trim() === "") setValue("event", "", { shouldDirty: true });
          }}
        />
        <p className="mt-1.5 min-h-4" />
      </div>
      <SelectField
        name="event"
        label="Evento"
        placeholder="Sem evento"
        options={events.map((item) => ({ value: item.id, label: `(${item.code}) ${item.name}` }))}
      />
    </div>
  );
}
