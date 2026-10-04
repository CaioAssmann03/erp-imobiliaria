import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { UnidadesTable } from "@/components/UnidadesTable";
import {
  getBlocosListQueryOptions,
  getCondominiosRetrieveQueryOptions,
  getUnidadesListQueryOptions,
} from "@/lib/api/generated";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getServerQueryClient } from "@/lib/query/server";

export default async function UnidadesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const condominioId = Number(id);

  const queryClient = getServerQueryClient();
  const [condominio] = await Promise.all([
    queryClient
      .fetchQuery(getCondominiosRetrieveQueryOptions(condominioId))
      .catch(() => undefined),
    queryClient.prefetchQuery(getBlocosListQueryOptions({ condominio: condominioId, limit: 100 })),
    queryClient.prefetchQuery(getUnidadesListQueryOptions({ condominio: condominioId, limit: DEFAULT_PAGE_SIZE })),
  ]);

  return (
    <div>
      <PageHeader
        back={{ href: "/condominios", label: "Condomínios" }}
        title={condominio ? `Unidades · ${condominio.nome}` : "Unidades"}
        actions={
          <>
            <LinkButton variant="secondary" href={`/condominios/${condominioId}`}>
              Editar condomínio
            </LinkButton>
            <LinkButton href={`/condominios/${condominioId}/unidades/novo`}>
              Nova unidade
            </LinkButton>
          </>
        }
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UnidadesTable condominioId={condominioId} />
      </HydrationBoundary>
    </div>
  );
}
