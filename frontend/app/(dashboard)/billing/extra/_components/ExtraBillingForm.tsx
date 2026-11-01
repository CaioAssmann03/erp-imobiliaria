"use client";

import { useWatch } from "react-hook-form";

import { DateField, MonthField } from "@/components/form/fields";

import { FieldRow, FormSection } from "@/components/form/FormSection";

import { extraBillingUrl, type ExtraBillingScope } from "@/lib/billing/extra-billing-workspace";
import { extraBillingDefaults, extraBillingSchema } from "@/lib/schemas/extra-billing";

import { UnitsPicker } from "../../entries/_components/entry-form/UnitsPicker";
import { ExtraLines } from "./ExtraLines";
import { ExtraResult } from "./ExtraResult";
import { useExtraScope } from "./use-extra-scope";
import { useExtraSubmit } from "./use-extra-submit";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { RecordForm } from "@/components/form/RecordForm";
import { useRecordForm } from "@/hooks/use-record-form";

function Form({ scope }: { scope: ExtraBillingScope }) {
  const methods = useRecordForm({ schema: extraBillingSchema, defaults: extraBillingDefaults(scope.condominium) });
  const { submit, isSubmitting, result, clearResult } = useExtraSubmit(methods.setError);

  if (result) {
    return (
      <ExtraResult
        result={result}
        condominiumId={scope.condominium}
        onEdit={clearResult}
        onNew={() => {
          methods.reset(extraBillingDefaults(scope.condominium));
          clearResult();
        }}
      />
    );
  }

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={extraBillingUrl(scope)}
      submitLabel="Emitir boleto extra"
      submittingLabel="Emitindo…"
    >
      <SectionAnchor id="boleto">
        <FormSection title="Boleto">
          <FieldRow>
            <MonthField name="competence_month" label="Competência" required hint="O mês a que a cobrança se refere." />
            <DateField name="due_date" label="Vencimento" required hint="Só deste boleto; a multa e os juros seguem as regras do condomínio." />
          </FieldRow>
        </FormSection>
      </SectionAnchor>
      <SectionAnchor id="unidades">
        <FormSection title="Unidades">
          <ExtraUnits />
        </FormSection>
      </SectionAnchor>
      <SectionAnchor id="valores">
        <ExtraLines />
      </SectionAnchor>
    </RecordForm>
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
