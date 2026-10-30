"use client";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useBillingEntriesList, useBillingEntriesRetrieve } from "@/lib/api/generated";
import { entryColumnTitle, formatCode } from "@/lib/billing-entry-payload";
import { MAX_ENTRIES_PER_MONTH } from "@/lib/billing-entry-workspace";
import { brl, formatMonth } from "@/lib/format";
import { throwIfNotFound } from "@/lib/query/not-found";
import { ALLOCATIONS, RECURRENCES } from "@/lib/schemas/billing-entry";

import { EntryActions } from "./EntryActions";
import { useEntriesScope } from "./use-entries-scope";

const labelOf = (options: readonly { value: string; label: string }[], value: string) => options.find((item) => item.value === value)?.label ?? value;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}

/**
 * Client Component: um lançamento aberto, só para consulta (para mudar um valor se exclui e se inclui outro): o que ele é, as ações (encerrar, excluir)
 * e o que cada unidade paga no mês da lista. O valor do mês vem da lista do condomínio, a mesma consulta da coluna da esquerda. As seções `lancamento` e
 * `valores` são as do índice da direita.
 */
export function BillingEntryView({ entryId }: { entryId: string }) {
  const scope = useEntriesScope();
  const { data: entry, isLoading, error } = useBillingEntriesRetrieve(entryId);
  throwIfNotFound(error);
  const { data: month } = useBillingEntriesList(
    { condominium: entry?.condominium ?? "", reference_month: scope.month, limit: MAX_ENTRIES_PER_MONTH },
    { query: { enabled: Boolean(entry) } }
  );

  if (isLoading) return <FormSkeleton sections={2} />;
  if (!entry) return null;

  const ofMonth = month?.results.find((item) => item.id === entryId)?.month;
  const title = entryColumnTitle({ ...entry, month: ofMonth }).title;
  const total = (ofMonth?.unit_amounts ?? []).reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0) / 100;

  return (
    <div className="space-y-4">
      <div id="lancamento" className="scroll-mt-20">
        <FormSection title="Lançamento" description="Um lançamento não se altera: para mudar um valor, exclua e inclua outro.">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Fact label="Condomínio">{entry.condominium_name}</Fact>
            <Fact label="Evento">
              {entry.event_code} · {entry.event_name}
            </Fact>
            {entry.description && <Fact label="Descrição">{entry.description}</Fact>}
            <Fact label="Rateio">
              {labelOf(ALLOCATIONS, entry.allocation)}
              {entry.apportionment_criterion_name && ` · ${entry.apportionment_criterion_name}`}
            </Fact>
            <Fact label={entry.allocation === "individual" ? "Valor por unidade" : "Total a ratear"}>
              <span className="tabular-nums">{brl(entry.amount)}</span>
            </Fact>
            <Fact label="Recorrência">
              {labelOf(RECURRENCES, entry.recurrence)}
              {entry.recurrence === "installments" && entry.installments_total ? ` · ${entry.installments_total} parcelas` : ""}
            </Fact>
            <Fact label="Início">{formatMonth(entry.start_month)}</Fact>
            {entry.end_month && <Fact label="Último mês">{formatMonth(entry.end_month)}</Fact>}
            <Fact label="Destino">{entry.event_credits_company ? "Conta da imobiliária" : `(${formatCode(entry.cost_center_code)}) ${entry.cost_center_name}`}</Fact>
          </dl>
          <EntryActions entry={entry} title={title} />
        </FormSection>
      </div>

      <div id="valores" className="scroll-mt-20">
        <FormSection title={`Valores de ${formatMonth(scope.month)}`} description="O que cada unidade paga neste lançamento no mês escolhido na lista.">
          {!ofMonth || ofMonth.unit_amounts.length === 0 ? (
            <p className="text-body text-ink-soft">Este lançamento não entra nos boletos de {formatMonth(scope.month)}.</p>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {ofMonth.unit_amounts.map((row) => (
                  <li key={row.unit} className="flex justify-between py-1.5 text-body">
                    <span>Unidade {row.unit_name}</span>
                    <span className="tabular-nums">{brl(row.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="flex justify-between border-t border-line pt-3 text-body font-medium">
                <span>Total</span>
                <span className="tabular-nums">{brl(total)}</span>
              </p>
            </>
          )}
        </FormSection>
      </div>
    </div>
  );
}
