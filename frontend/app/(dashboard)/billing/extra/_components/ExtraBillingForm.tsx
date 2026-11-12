"use client";

import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";

import { DateField, MonthField } from "@/components/form/fields";
import { ChooseCondominiumCard } from "@/components/form/ChooseCondominiumCard";
import { CondominiumField } from "@/components/form/CondominiumField";

import { FieldRow, FormSection } from "@/components/form/FormSection";

import { extraBillingUrl, newExtraBillingUrl, type ExtraBillingScope } from "@/lib/billing/extra-billing-workspace";
import { extraBillingDefaults, extraBillingSchema } from "@/lib/schemas/extra-billing";

import { ExtraLines } from "./ExtraLines";
import { ExtraUnitsSelector } from "./ExtraUnitsSelector";
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
          <ExtraCondominium />
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

/**
 * O condomínio do boleto (o da lista ao lado; trocá-lo leva a lista junto, pela URL, e limpa o formulário, cujas unidades e linhas eram do outro
 * condomínio).
 */
function ExtraCondominium() {
  const router = useRouter();
  const { reset } = useFormContext();
  const condominium = useWatch({ name: "condominium" }) as string;

  return (
    <CondominiumField
      value={condominium}
      onChange={(next) => {
        reset(extraBillingDefaults(next));
        router.replace(newExtraBillingUrl({ condominium: next }));
      }}
    />
  );
}

/** As unidades do boleto, escolhidas pela regra (todas, por bloco ou específicas); recriado a cada condomínio, para não levar os blocos e as unidades de outro. */
function ExtraUnits() {
  const condominium = useWatch({ name: "condominium" }) as string;
  return <ExtraUnitsSelector key={condominium} condominium={condominium} />;
}

/** Client Component: o boleto extra novo, no condomínio da lista: mês e vencimento, as unidades e as linhas; depois de emitir, mostra o que saiu. Sem condomínio escolhido, pede o condomínio antes do resto. */
export function ExtraBillingForm() {
  const router = useRouter();
  const scope = useExtraScope();

  if (scope.condominium === "") return <ChooseCondominiumCard what="do boleto" onChoose={(condominium) => router.replace(newExtraBillingUrl({ condominium }))} />;

  return <Form scope={scope} />;
}
