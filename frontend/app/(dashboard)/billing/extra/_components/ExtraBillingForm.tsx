"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { useCondominiumsList } from "@/lib/api/generated";
import { maskMonthYear } from "@/lib/billing-plan-payload";
import {
  extraBillingDefaults,
  extraBillingSchema,
  type ExtraBillingFormInput,
  type ExtraBillingFormOutput,
} from "@/lib/schemas/extra-billing";

import { UnitsPicker } from "../../entries/_components/entry-form/UnitsPicker";
import { ExtraLines } from "./ExtraLines";
import { ExtraResult } from "./ExtraResult";
import { useExtraSubmit } from "./use-extra-submit";

/** A tela do boleto extra: condomínio, mês e vencimento, as unidades e as linhas; depois de emitir, mostra o que saiu. */
export function ExtraBillingForm() {
  const methods = useForm<ExtraBillingFormInput, unknown, ExtraBillingFormOutput>({
    resolver: zodResolver(extraBillingSchema),
    defaultValues: extraBillingDefaults(),
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError, setValue, getValues } = methods;
  const { submit, isSubmitting, result, clearResult } = useExtraSubmit(setError);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  if (result) {
    return (
      <ExtraResult
        result={result}
        condominiumId={getValues("condominium")}
        onEdit={clearResult}
        onNew={() => {
          reset(extraBillingDefaults());
          clearResult();
        }}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="mx-auto flex w-full max-w-4xl flex-col gap-4"
      >
        <FormSection title="Boleto" description="O vencimento é só deste boleto; a multa e os juros seguem as regras do condomínio.">
          <SelectField
            name="condominium"
            label="Condomínio"
            required
            placeholder="Selecione"
            onValueChange={() => {
              setValue("units", [], { shouldDirty: true });
              setValue("lines", extraBillingDefaults().lines);
            }}
            options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
          />
          <FieldRow>
            <TextField
              name="competence_month"
              label="Competência"
              required
              inputMode="numeric"
              placeholder="MM/AAAA"
              maxLength={7}
              mask={maskMonthYear}
              autoComplete="off"
              hint="O mês a que a cobrança se refere."
            />
            <TextField name="due_date" label="Vencimento" type="date" required />
          </FieldRow>
        </FormSection>
        <FormSection title="Unidades" description="Quem recebe o boleto. Cada unidade recebe o seu, com a sua parte do rateio.">
          <ExtraUnits />
        </FormSection>
        <ExtraLines />
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => reset(extraBillingDefaults())}>
            Limpar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-32">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? "Emitindo…" : "Emitir boleto extra"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/** O seletor de unidades da Inclusão de valores, com o condomínio escolhido acima. */
function ExtraUnits() {
  const condominium = useWatch({ name: "condominium" }) as string;
  return <UnitsPicker condominium={condominium} />;
}
