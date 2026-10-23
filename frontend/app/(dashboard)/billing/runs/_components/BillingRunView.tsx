import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import type { BillingRun } from "@/lib/api/generated/models";
import { issuedNothing } from "@/lib/billing-documents";
import { formatDateTime, formatMonth } from "@/lib/format";

import { BillingRunCounts } from "./BillingRunCounts";
import { BillingRunProblems } from "./BillingRunProblems";
import { BillingRunStatusBadge } from "./BillingRunStatusBadge";

/** Situação, contagens, problemas explicados e o atalho para os documentos do mês. */
export function BillingRunView({ run }: { run: BillingRun }) {
  return (
    <div className="space-y-4">
      <FormSection title={`${run.condominium_name} · ${formatMonth(run.reference_month)}`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body">
          <BillingRunStatusBadge status={run.status} counts={run} />
          <span className="text-ink-soft">
            Início {formatDateTime(run.started_at)}
            {run.finished_at ? ` · fim ${formatDateTime(run.finished_at)}` : ""}
          </span>
          <Link
            href={`/billing/documents?condominium=${run.condominium}&reference_month=${run.reference_month}`}
            className="text-ink underline"
          >
            Ver os documentos do mês
          </Link>
        </div>
        {run.status !== "failed" && issuedNothing(run) && (
          <p role="alert" className="rounded-panel bg-warning-soft px-4 py-2.5 text-body text-ink">
            Nenhum documento foi emitido neste mês. Veja abaixo o motivo de cada unidade e corrija antes de emitir de novo.
          </p>
        )}
        <BillingRunCounts run={run} />
      </FormSection>
      <FormSection title="Problemas" description="Unidades puladas ou com falha e o que impediu a emissão.">
        <BillingRunProblems run={run} />
      </FormSection>
    </div>
  );
}
