"use client";

import { useSearchParams } from "next/navigation";

/** Client Component: o centro da tela de unidades sem unidade aberta; o texto depende de já haver condomínio escolhido. */
export function UnitsEmptyState() {
  const hasCondominium = Boolean(useSearchParams().get("condominium"));

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">{hasCondominium ? "Escolha uma unidade" : "Escolha um condomínio"}</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {hasCondominium
          ? "Selecione uma unidade na lista para ver os dados, o proprietário, o inquilino e a cobrança, ou cadastre uma nova."
          : "Escolha o condomínio na coluna da esquerda para ver as unidades dele e cadastrar novas."}
      </p>
    </div>
  );
}
