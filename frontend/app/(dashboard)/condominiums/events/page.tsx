import type { Metadata } from "next";

export const metadata: Metadata = { title: "Eventos" };

export default function BillingEventsPage() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha um evento</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione um evento na lista para ver e editar, ou cadastre um novo. Os códigos preenchem a descrição de um lançamento (ex.: 250 = Limpeza do condomínio).
      </p>
    </div>
  );
}
