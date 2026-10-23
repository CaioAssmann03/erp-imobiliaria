"use client";

import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useBillingRunsRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";

import { BillingRunView } from "./BillingRunView";

/** Client Component: busca a execução e mostra a `BillingRunView`; um 404 vira a página "não encontrada". */
export function BillingRunDetail({ runId }: { runId: string }) {
  const { data: run, error } = useBillingRunsRetrieve(runId);
  throwIfNotFound(error);

  if (!run) return <FormSkeleton sections={2} />;
  return <BillingRunView run={run} />;
}
