import { CondominioForm } from "@/components/CondominioForm";

export default function NovoCondominioPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Novo condomínio
      </h1>
      <CondominioForm />
    </div>
  );
}
