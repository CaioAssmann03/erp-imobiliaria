import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catálogo de sub-contas" };

export default function CostCenterCatalogPage() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha uma sub-conta</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione uma sub-conta na lista para ver e editar, ou cadastre uma nova. As sub-contas da administradora têm código e nome uma vez só; cada condomínio escolhe as que usa, e os saldos continuam por condomínio.
      </p>
    </div>
  );
}
