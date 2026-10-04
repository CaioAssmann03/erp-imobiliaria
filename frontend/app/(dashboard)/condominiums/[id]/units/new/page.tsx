import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { UnidadeForm } from "@/components/UnidadeForm";

export default async function NovaUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader
        back={{ href: `/condominios/${id}/unidades`, label: "Unidades" }}
        title="Nova unidade"
      />
      <UnidadeForm condominioId={Number(id)} />
    </FormPage>
  );
}
