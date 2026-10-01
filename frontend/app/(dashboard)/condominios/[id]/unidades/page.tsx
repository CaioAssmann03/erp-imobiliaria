import { UnidadesList } from "@/components/UnidadesList";

export default async function UnidadesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UnidadesList condominioId={Number(id)} />;
}
