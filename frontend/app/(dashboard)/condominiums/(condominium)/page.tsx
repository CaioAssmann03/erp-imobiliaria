import type { Metadata } from "next";

export const metadata: Metadata = { title: "Condomínios" };

export default function CondominiumsPage() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha um condomínio</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione um condomínio na lista para ver e editar seus dados, blocos, unidades e sub-contas, ou cadastre um novo.
      </p>
    </div>
  );
}
