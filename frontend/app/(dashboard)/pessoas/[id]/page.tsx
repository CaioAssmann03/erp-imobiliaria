import { PessoaForm } from "@/components/PessoaForm";

export default async function EditarPessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Editar pessoa
      </h1>
      <PessoaForm pessoaId={Number(id)} />
    </div>
  );
}
