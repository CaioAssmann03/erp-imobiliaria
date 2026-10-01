import { PessoaForm } from "@/components/PessoaForm";

export default function NovaPessoaPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Nova pessoa
      </h1>
      <PessoaForm />
    </div>
  );
}
