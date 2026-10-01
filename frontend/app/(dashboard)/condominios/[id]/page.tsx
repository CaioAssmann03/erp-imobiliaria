import { CondominioForm } from "@/components/CondominioForm";

export default async function EditarCondominioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Editar condomínio
      </h1>
      <CondominioForm condominioId={Number(id)} />
    </div>
  );
}
