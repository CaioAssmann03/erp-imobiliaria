import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { UnitsTable } from "./_components/UnitsTable";
import {
  getBlocksListQueryOptions,
  getCondominiumsRetrieveQueryOptions,
  getUnitsListQueryOptions,
} from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Unidades" };

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const condominiumId = id;

  const queryClient = getServerQueryClient();
  const [condominium] = await Promise.all([
    queryClient
      .fetchQuery(getCondominiumsRetrieveQueryOptions(condominiumId))
      .catch(() => undefined),
    queryClient.prefetchQuery(getBlocksListQueryOptions({ condominium: condominiumId, limit: 100 })),
    queryClient.prefetchQuery(getUnitsListQueryOptions({ condominium: condominiumId, limit: DEFAULT_PAGE_SIZE })),
  ]);

  return (
    <div>
      <PageHeader
        back={{ href: "/condominiums", label: "Condomínios" }}
        title={condominium ? `Unidades · ${condominium.name}` : "Unidades"}
        actions={
          <>
            <LinkButton variant="secondary" href={`/condominiums/${condominiumId}`}>
              Editar condomínio
            </LinkButton>
            <LinkButton href={`/condominiums/${condominiumId}/units/new`}>
              Nova unidade
            </LinkButton>
          </>
        }
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UnitsTable condominiumId={condominiumId} />
      </HydrationBoundary>
    </div>
  );
}
