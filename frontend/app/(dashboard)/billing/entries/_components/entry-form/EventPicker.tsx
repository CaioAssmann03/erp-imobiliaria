"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SelectField } from "@/components/form/fields";
import { useBillingEventsList } from "@/lib/api/generated";
import { inputClass } from "@/lib/ui";

/**
 * O evento pelo código (quem lança sabe que 250 é "Limpeza do condomínio") ou pela lista. Escolhê-lo preenche a
 * descrição do boleto; a descrição digitada vem depois dele ("Limpeza do condomínio - 10/2026").
 */
export function EventPicker() {
  const { setValue } = useFormContext();
  const event = useWatch({ name: "event" }) as string;
  // `null` = o código mostrado é o do evento escolhido; texto = o que a pessoa digitou (que pode ainda não existir).
  const [typedCode, setTypedCode] = useState<string | null>(null);
  const { data } = useBillingEventsList({ active: true, limit: 100 });
  const events = data?.results;
  const selected = events?.find((item) => item.id === event);
  const code = typedCode ?? (selected ? String(selected.code) : "");

  // O código digitado vale assim que existir um evento com ele (a lista pode chegar depois da digitação).
  useEffect(() => {
    const match = typedCode === null || typedCode.trim() === "" ? undefined : events?.find((item) => String(item.code) === typedCode.trim());
    if (match && match.id !== event) setValue("event", match.id, { shouldDirty: true });
  }, [typedCode, event, events, setValue]);

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
          value={code}
          onChange={(inputEvent) => {
            setTypedCode(inputEvent.target.value);
            if (inputEvent.target.value.trim() === "") setValue("event", "", { shouldDirty: true });
          }}
        />
        <p className="mt-1.5 min-h-4" />
      </div>
      <SelectField
        name="event"
        label="Evento"
        placeholder="Sem evento"
        onValueChange={() => setTypedCode(null)}
        options={(events ?? []).map((item) => ({ value: item.id, label: `(${item.code}) ${item.name}` }))}
      />
    </div>
  );
}
