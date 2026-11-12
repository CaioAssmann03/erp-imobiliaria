"use client";

import { useSearchParams } from "next/navigation";

/** Client Component: o centro da tela de sub-contas sem sub-conta aberta; o texto depende de já haver um condomínio escolhido (`?condominium=`). */
export function CostCentersEmptyState() {
  const hasCondominium = Boolean(useSearchParams().get("condominium"));

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">{hasCondominium ? "Escolha uma sub-conta" : "Escolha um condomínio"}</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {hasCondominium
          ? "Selecione uma sub-conta na lista para ver os dados dela, ou cadastre uma nova."
          : "Escolha o condomínio na coluna da esquerda para ver as sub-contas dele e cadastrar novas."}
      </p>
    </div>
  );
}
