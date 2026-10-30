"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useCondominiumsRetrieve } from "@/lib/api/generated";
import { cn } from "@/lib/utils";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação do condomínio aberto, a situação em texto simples e colorido (verde ativo, âmbar inativo), sem selo.
 * Usa a mesma consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. No celular (onde a lista de condomínios não
 * fica ao lado) tem o "voltar" à lista no alto.
 */
export function CondominiumHeader({ condominiumId }: { condominiumId: string }) {
  const { data: condominium } = useCondominiumsRetrieve(condominiumId);

  const back = (
    <div className="lg:hidden">
      <BackLink href="/condominiums" label="Condomínios" />
    </div>
  );

  if (!condominium)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  const active = condominium.active ?? true;

  return (
    <>
    {back}
    <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-title">
        <span className="tabular-nums text-ink-faint">{String(condominium.code).padStart(4, "0")}</span>
        <span className="text-ink-faint"> · </span>
        {condominium.name}
      </h1>
      <span className={cn("text-body font-medium", active ? "text-success" : "text-warning")}>{active ? "Ativo" : "Inativo"}</span>
    </div>
    </>
  );
}
