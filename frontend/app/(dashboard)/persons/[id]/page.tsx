import { FormPage } from "@/components/form/FormPage";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { PessoaForm } from "@/components/PessoaForm";
import { getPessoasRetrieveQueryOptions } from "@/lib/api/generated";
import { getServerQueryClient } from "@/lib/query/server";

export default async function EditarPessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pessoaId = Number(id);

  const queryClient = getServerQueryClient();
  await queryClient.prefetchQuery(getPessoasRetrieveQueryOptions(pessoaId));

  return (
    <FormPage>
      <PageHeader back={{ href: "/pessoas", label: "Pessoas" }} title="Editar pessoa" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PessoaForm pessoaId={pessoaId} />
      </HydrationBoundary>
    </FormPage>
  );
}
