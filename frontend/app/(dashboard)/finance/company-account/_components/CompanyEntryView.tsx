"use client";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useCompanyEntriesRetrieve } from "@/lib/api/generated";
import { brl, formatDate, formatMonth } from "@/lib/format/format";
import { throwIfPageError } from "@/lib/query/page-error";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}

/** Client Component: um lançamento da imobiliária, só para consulta (nasce do pagamento de um boleto e nunca se altera nem se apaga). */
export function CompanyEntryView({ entryId }: { entryId: string }) {
  const { data: entry, isLoading, error } = useCompanyEntriesRetrieve(entryId);
  throwIfPageError(error);

  if (isLoading) return <FormSkeleton sections={1} />;
  if (!entry) return null;

  return (
    <div id="lancamento" className="scroll-mt-20">
      <FormSection title="Lançamento" description="Registrado quando o boleto foi pago. Não pode ser alterado.">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Item label="Data">
            <span className="tabular-nums">{formatDate(entry.entry_date)}</span>
          </Item>
          <Item label="Valor">
            <span className="tabular-nums">{brl(entry.amount)}</span>
          </Item>
          <Item label="Competência">
            <span className="tabular-nums">{formatMonth(entry.reference_month)}</span>
          </Item>
          <Item label="Condomínio">{entry.condominium_name || "—"}</Item>
          <Item label="Unidade">{entry.unit_name || "—"}</Item>
        </dl>
      </FormSection>
    </div>
  );
}
