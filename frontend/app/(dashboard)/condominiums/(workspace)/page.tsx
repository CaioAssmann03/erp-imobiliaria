import type { Metadata } from "next";

import { getCondominiumsListQueryOptions } from "@/lib/api/generated";
import type { CondominiumsListPending } from "@/lib/api/generated/models";
import { pendingFromParam } from "@/lib/condominium-list";
import { getServerQueryClient } from "@/lib/query/server";

import { OpenFirstCondominium } from "../_components/workspace/OpenFirstCondominium";

export const metadata: Metadata = { title: "Condomínios" };

/**
 * `/condominiums`: no computador abre o primeiro condomínio da lista (do filtro `?pending=`, quando vem dos atalhos do
 * início); no celular a página é a própria lista.
 */
export default async function CondominiumsPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const pending = pendingFromParam((await searchParams).pending);
  const queryClient = getServerQueryClient();
  const firstPage = await queryClient
    .fetchQuery(
      getCondominiumsListQueryOptions({
        active: true,
        ordering: "code",
        limit: 1,
        ...(pending ? { pending: pending as CondominiumsListPending } : {}),
      }),
    )
    .catch(() => undefined);

  return <OpenFirstCondominium firstId={firstPage?.results[0]?.id} />;
}
