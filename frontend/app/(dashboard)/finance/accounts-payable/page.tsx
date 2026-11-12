import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contas a pagar" };

export default function AccountsPayablePage() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha uma conta</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione uma conta na lista para ver, dar baixa ou cancelar, ou cadastre uma nova. A lista abre mostrando as contas em aberto.
      </p>
    </div>
  );
}
