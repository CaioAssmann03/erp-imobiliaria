import { UnidadeForm } from "@/components/UnidadeForm";

export default async function NovaUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Nova unidade
      </h1>
      <UnidadeForm condominioId={Number(id)} />
    </div>
  );
}
