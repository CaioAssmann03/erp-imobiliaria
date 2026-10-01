import { UnidadeForm } from "@/components/UnidadeForm";

export default async function EditarUnidadePage({
  params,
}: {
  params: Promise<{ id: string; unidadeId: string }>;
}) {
  const { id, unidadeId } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Editar unidade
      </h1>
      <UnidadeForm condominioId={Number(id)} unidadeId={Number(unidadeId)} />
    </div>
  );
}
