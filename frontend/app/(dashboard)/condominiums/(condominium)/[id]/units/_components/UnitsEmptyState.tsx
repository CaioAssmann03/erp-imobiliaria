"use client";

import { useSearchParams } from "next/navigation";

import { PENDING_OPTIONS } from "./unit-filter-groups";

/** Client Component: o centro da tela de unidades sem unidade aberta; o texto depende de haver uma pendência do painel ou um condomínio já escolhido. */
export function UnitsEmptyState() {
  const params = useSearchParams();
  const hasCondominium = Boolean(params.get("condominium"));
  const pending = PENDING_OPTIONS.find((option) => option.value === params.get("pending"));

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">{pending ? `Pendência: ${pending.label.toLowerCase()}` : hasCondominium ? "Escolha uma unidade" : "Escolha um condomínio"}</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {pending
          ? "A lista ao lado mostra as unidades de todos os condomínios com essa pendência. Escolha uma para corrigir; ao resolver, ela sai da lista."
          : hasCondominium
            ? "Selecione uma unidade na lista para ver os dados, o proprietário, o inquilino e a cobrança, ou cadastre uma nova."
            : "Escolha o condomínio na coluna da esquerda para ver as unidades dele e cadastrar novas."}
      </p>
    </div>
  );
}
