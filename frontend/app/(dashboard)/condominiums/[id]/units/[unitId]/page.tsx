import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { UnidadeForm } from "@/components/UnidadeForm";
import {
  getBlocosListQueryOptions,
  getUnidadesRetrieveQueryOptions,
} from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export default async function EditarUnidadePage({
  params,
}: {
  params: Promise<{ id: string; unidadeId: string }>;
}) {
  const { id, unidadeId } = await params;
  const condominioId = Number(id);

  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getUnidadesRetrieveQueryOptions(Number(unidadeId))),
    queryClient.prefetchQuery(getBlocosListQueryOptions({ condominio: condominioId, limit: 100 })),
  ]);

  return (
    <FormPage>
      <PageHeader
        back={{ href: `/condominios/${condominioId}/unidades`, label: "Unidades" }}
        title="Editar unidade"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UnidadeForm condominioId={condominioId} unidadeId={Number(unidadeId)} />
      </HydrationBoundary>
    </FormPage>
  );
}
