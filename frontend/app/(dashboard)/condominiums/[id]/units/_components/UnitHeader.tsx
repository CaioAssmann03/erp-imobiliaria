"use client";

import { LinkButton } from "@/components/LinkButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnitsRetrieve } from "@/lib/api/generated";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { cn } from "@/lib/utils";
import { condominiumUrl } from "@/lib/condominium-registry";
import { unitListLabel } from "@/lib/unit-workspace";

/**
 * Client Component: o nome da unidade aberta e, em texto simples ao lado (sem selo), se é a do síndico e se está ativa (verde) ou inativa (âmbar); usa a mesma consulta do
 * formulário (uma só chamada). O Excluir fica na barra de ações dele.
 */
export function UnitHeader({ condominiumId, unitId }: { condominiumId: string; unitId: string }) {
  const { data: unit } = useUnitsRetrieve(unitId);

  if (!unit) return <Skeleton className="mb-6 h-9 w-72 rounded-control" />;

  const active = unit.active ?? true;

  return (
    <div className="mb-6">
      <LinkButton
        href={condominiumUrl(condominiumId)}
        variant="ghost"
        size="sm"
        className="-ml-2.5 mb-2 px-2.5 text-ink-soft hover:text-ink lg:hidden"
      >
        Condomínio
      </LinkButton>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-title">{unitListLabel(unitTypeLabel(unit.type), unit.name)}</h1>
        {unit.is_manager_unit && <span className="text-body text-ink-soft">Síndico</span>}
        <span className={cn("text-body font-medium", active ? "text-success" : "text-warning")}>{active ? "Ativa" : "Inativa"}</span>
      </div>
    </div>
  );
}
