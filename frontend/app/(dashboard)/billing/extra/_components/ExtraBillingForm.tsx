"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { DateField, MonthField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { extraBillingUrl, type ExtraBillingScope } from "@/lib/billing/extra-billing-workspace";
import {
  extraBillingDefaults,
  extraBillingSchema,
  type ExtraBillingFormInput,
  type ExtraBillingFormOutput,
} from "@/lib/schemas/extra-billing";
import { toast } from "@/lib/errors/toast";

import { UnitsPicker } from "../../entries/_components/entry-form/UnitsPicker";
import { ExtraLines } from "./ExtraLines";
import { ExtraResult } from "./ExtraResult";
import { useExtraScope } from "./use-extra-scope";
import { useExtraSubmit } from "./use-extra-submit";

function Form({ scope }: { scope: ExtraBillingScope }) {
  const router = useRouter();
  const methods = useForm<ExtraBillingFormInput, unknown, ExtraBillingFormOutput>({
    resolver: zodResolver(extraBillingSchema),
    defaultValues: extraBillingDefaults(scope.condominium),
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting, result, clearResult } = useExtraSubmit(setError);

  if (result) {
    return (
      <ExtraResult
        result={result}
        condominiumId={scope.condominium}
        onEdit={clearResult}
        onNew={() => {
          reset(extraBillingDefaults(scope.condominium));
          clearResult();
        }}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))} className="space-y-4">
        <div id="boleto" className="scroll-mt-20">
          <FormSection title="Boleto">
            <FieldRow>
              <MonthField name="competence_month" label="Competência" required hint="O mês a que a cobrança se refere." />
              <DateField name="due_date" label="Vencimento" required hint="Só deste boleto; a multa e os juros seguem as regras do condomínio." />
            </FieldRow>
          </FormSection>
        </div>
        <div id="unidades" className="scroll-mt-20">
          <FormSection title="Unidades">
            <ExtraUnits />
          </FormSection>
        </div>
        <div id="valores" className="scroll-mt-20">
          <ExtraLines />
        </div>
        <FormActions isSubmitting={isSubmitting} submitLabel="Emitir boleto extra" submittingLabel="Emitindo…">
          <Button type="button" variant="secondary" onClick={() => router.push(extraBillingUrl(scope))}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}

/** O seletor de unidades da Inclusão de valores, com o condomínio da lista. */
function ExtraUnits() {
  const condominium = useWatch({ name: "condominium" }) as string;
  return <UnitsPicker condominium={condominium} />;
}

/** Client Component: o boleto extra novo, no condomínio da lista: mês e vencimento, as unidades e as linhas; depois de emitir, mostra o que saiu. */
export function ExtraBillingForm() {
  const scope = useExtraScope();

  if (scope.condominium === "")
    return (
      <div className="rounded-card bg-surface p-8 text-center">
        <p className="text-body text-ink-soft">Escolha o condomínio na lista para emitir um boleto extra para ele.</p>
      </div>
    );

  return <Form scope={scope} />;
}
