import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pessoas" };

export default function PersonsPage() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha uma pessoa</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione uma pessoa na lista para ver e editar os dados dela, ou cadastre uma nova. Proprietários, inquilinos e demais contatos ficam aqui.
      </p>
    </div>
  );
}
