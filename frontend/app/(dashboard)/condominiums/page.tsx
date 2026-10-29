import type { Metadata } from "next";

export const metadata: Metadata = { title: "Condomínios" };

/** `/condominiums`: no desktop o meio pede para escolher um condomínio; no celular só a lista aparece. */
export default function CondominiumsPage() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-card bg-surface px-6 py-20 text-center">
      <div>
        <p className="text-heading">Escolha um condomínio</p>
        <p className="mt-1 text-body text-ink-soft">Selecione um da lista ao lado ou cadastre um novo.</p>
      </div>
    </div>
  );
}
