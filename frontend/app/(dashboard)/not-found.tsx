import { LinkButton } from "@/components/LinkButton";

/** Endereço ou registro que não existe (ou que é de outra empresa). */
export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-title">Página não encontrada</h1>
      <p className="text-body text-ink-soft">O endereço não existe ou o registro foi removido.</p>
      <LinkButton href="/">Ir ao painel</LinkButton>
    </div>
  );
}
