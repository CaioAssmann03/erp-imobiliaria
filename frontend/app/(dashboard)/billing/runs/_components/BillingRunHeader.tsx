"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingRunsRetrieve } from "@/lib/api/generated";
import { billingRunsUrl } from "@/lib/billing/billing-run-workspace";
import { formatMonth } from "@/lib/format/format";

import { useRunsScope } from "./use-runs-scope";

/**
 * Client Component: a execução aberta: "Emissão de" e o mês e, em cinza, o condomínio. Usa a mesma consulta da tela da execução (uma só chamada). No celular, onde a
 * lista não fica ao lado, tem o "voltar" a ela no alto.
 */
export function BillingRunHeader({ runId }: { runId: string }) {
  const scope = useRunsScope();
  const { data: run } = useBillingRunsRetrieve(runId);

  return (
    <>
      <div className="lg:hidden">
        <BackLink href={billingRunsUrl(scope)} label="Execuções" />
      </div>
      {run ? (
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-title">Emissão de {formatMonth(run.reference_month)}</h1>
          <span className="text-body text-ink-soft">{run.condominium_name}</span>
        </div>
      ) : (
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      )}
    </>
  );
}
