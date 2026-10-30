import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import type { BillingRun } from "@/lib/api/generated/models";
import { issuedNothing } from "@/lib/billing/billing-documents";
import { formatDateTime } from "@/lib/format/format";

import { BillingRunCounts } from "./BillingRunCounts";
import { BillingRunProblems } from "./BillingRunProblems";
import { BillingRunStatusBadge } from "./BillingRunStatusBadge";

/**
 * O resumo numa linha só (a situação, quando rodou e o atalho para os documentos do mês) com as contagens embaixo, e os problemas explicados. O título da página
 * (`BillingRunHeader`) já diz o mês e o condomínio, então o resumo não os repete.
 */
export function BillingRunView({ run }: { run: BillingRun }) {
  return (
    <div className="space-y-4">
      <div id="resumo" className="scroll-mt-20">
        <FormSection>
          {run.status !== "failed" && issuedNothing(run) && (
            <p role="alert" className="rounded-panel bg-warning-soft px-4 py-2.5 text-body text-ink">
              Nenhum documento foi emitido neste mês. Veja abaixo o motivo de cada unidade e corrija antes de emitir de novo.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-body">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <BillingRunStatusBadge status={run.status} counts={run} />
              <span className="text-ink-soft">{run.finished_at ? formatDateTime(run.started_at) : `em andamento desde ${formatDateTime(run.started_at)}`}</span>
            </div>
            <Link
              href={`/billing/documents?condominium=${run.condominium}&reference_month=${run.reference_month}`}
              className="text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:underline"
            >
              Ver os documentos do mês
            </Link>
          </div>
          <BillingRunCounts run={run} />
        </FormSection>
      </div>
      <div id="problemas" className="scroll-mt-20">
        <FormSection title="Problemas" hint="Unidades puladas ou com falha e o que impediu a emissão.">
          <BillingRunProblems run={run} />
        </FormSection>
      </div>
    </div>
  );
}
