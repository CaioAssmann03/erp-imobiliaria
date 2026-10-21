"use client";

import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useBillingRunsRetrieve } from "@/lib/api/generated";
import { formatMonth } from "@/lib/format";

import { BillingRunCounts } from "./BillingRunCounts";
import { BillingRunProblems } from "./BillingRunProblems";
import { BillingRunStatusBadge } from "./BillingRunStatusBadge";

const dateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Página de uma execução: situação, contagens, problemas explicados e o atalho para os documentos do mês. */
export function BillingRunView({ runId }: { runId: string }) {
  const { data: run, isLoading } = useBillingRunsRetrieve(runId);
  if (isLoading || !run) return <FormSkeleton sections={2} />;

  return (
    <div className="space-y-4">
      <FormSection title={`${run.condominium_name} · ${formatMonth(run.reference_month)}`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body">
          <BillingRunStatusBadge status={run.status} />
          <span className="text-ink-soft">
            Início {dateTime(run.started_at)}
            {run.finished_at ? ` · fim ${dateTime(run.finished_at)}` : ""}
          </span>
          <Link
            href={`/billing/documents?condominium=${run.condominium}&reference_month=${run.reference_month}`}
            className="text-ink underline"
          >
            Ver os documentos do mês
          </Link>
        </div>
        <BillingRunCounts run={run} />
      </FormSection>
      <FormSection title="Problemas" description="Unidades puladas ou com falha e o que impediu a emissão.">
        <BillingRunProblems run={run} />
      </FormSection>
    </div>
  );
}
