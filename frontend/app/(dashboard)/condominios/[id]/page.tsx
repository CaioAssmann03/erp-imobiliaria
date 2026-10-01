import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CondominioForm } from "@/components/CondominioForm";
import { PageHeader } from "@/components/PageHeader";
import {
  getCondominiosRetrieveQueryOptions,
  getEmpresasListQueryOptions,
} from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export default async function EditarCondominioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const condominioId = Number(id);

  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(getCondominiosRetrieveQueryOptions(condominioId)),
    queryClient.prefetchQuery(getEmpresasListQueryOptions({ limit: 100 })),
  ]);

  return (
    <FormPage>
      <PageHeader
        back={{ href: "/condominios", label: "Condomínios" }}
        title="Editar condomínio"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CondominioForm condominioId={condominioId} />
      </HydrationBoundary>
    </FormPage>
  );
}
