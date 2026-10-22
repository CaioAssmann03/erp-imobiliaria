import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { StatusBadge } from "@/components/StatusBadge";
import {
  getCompaniesListQueryOptions,
  getCondominiumsApportionmentQueryOptions,
  getCondominiumsRetrieveQueryOptions,
  getLateInterestRatesListQueryOptions,
} from "@/lib/api/generated";
import { formatCondominiumCode } from "@/lib/condominium-list";
import { getMapsEmbedKey } from "@/lib/maps-embed-key";
import { fetchOrNotFound } from "@/lib/query/fetch-or-not-found";
import { getServerQueryClient } from "@/lib/query/server";

import { CondominiumForm } from "../../_components/CondominiumForm";
import { BackToList } from "../../_components/workspace/BackToList";
import { SectionMenu } from "../../_components/workspace/SectionMenu";
import { WORKSPACE_SECTIONS } from "../../_components/workspace/sections";

export const metadata: Metadata = { title: "Condomínio" };

export default async function CondominiumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: condominiumId } = await params;

  const queryClient = getServerQueryClient();
  await Promise.all([
    fetchOrNotFound(queryClient, getCondominiumsRetrieveQueryOptions(condominiumId)),
    queryClient.prefetchQuery(getCompaniesListQueryOptions({ limit: 100 })),
    // As taxas de juros e o rateio aparecem no próprio formulário: com a mesma chave que o cliente usa.
    queryClient.prefetchQuery(getLateInterestRatesListQueryOptions({ condominium: condominiumId, limit: 100 })),
    queryClient.prefetchQuery(getCondominiumsApportionmentQueryOptions(condominiumId)),
  ]);
  const condominium = queryClient.getQueryData(getCondominiumsRetrieveQueryOptions(condominiumId).queryKey);

  return (
    <div className="space-y-4">
      <BackToList />
      {condominium && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-title">
            <span className="tabular-nums text-ink-soft">{formatCondominiumCode(condominium.code)}</span>{" "}
            {condominium.name}
          </h2>
          {!condominium.active && <StatusBadge active={false} />}
        </header>
      )}
      <div className="space-y-4 xl:grid xl:grid-cols-[minmax(0,1fr)_12.5rem] xl:gap-4 xl:space-y-0">
        <div className="xl:col-start-2 xl:row-start-1">
          <SectionMenu sections={WORKSPACE_SECTIONS} />
        </div>
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <CondominiumForm condominiumId={condominiumId} mapsEmbedKey={getMapsEmbedKey()} />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}
