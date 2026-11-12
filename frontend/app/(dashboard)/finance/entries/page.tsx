import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lançamento manual" };

export default function EntriesPage() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha um lote</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione um lote na lista para ver os lançamentos dele ou estornar um, ou registre um novo. Tarifas, ajustes e outros movimentos fora de contas a pagar.
      </p>
    </div>
  );
}
