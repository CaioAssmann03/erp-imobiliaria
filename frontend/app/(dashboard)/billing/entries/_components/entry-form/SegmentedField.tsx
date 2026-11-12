"use client";

import { useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FormField } from "@/components/form/FormField";
import { SegmentedControl } from "@/components/form/SegmentedControl";

interface SegmentedFieldProps {
  name: string;
  label: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
}

/** Poucas opções lado a lado (Individual · Coletivo · Fração); grava o valor escolhido no formulário. */
export function SegmentedField({ name, label, hint, options }: SegmentedFieldProps) {
  const { setValue } = useFormContext();
  const current = useWatch({ name }) as string;
  const id = useId();

  return (
    <FormField id={id} label={label} hint={hint}>
      <SegmentedControl id={id} label={label} value={current} options={options} onChange={(value) => setValue(name, value, { shouldDirty: true, shouldValidate: true })} />
    </FormField>
  );
}
