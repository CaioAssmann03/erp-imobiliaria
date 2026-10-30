"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useBlocksRetrieve } from "@/lib/api/generated";

import { CondominiumBackLink } from "@/app/(dashboard)/condominiums/_components/condominium/CondominiumBackLink";

/**
 * Client Component: o título do bloco aberto (`Bloco · A`) com o "voltar" ao condomínio dele em cima, igual na página do bloco e na sub-tela de
 * unidades (um registro e as sub-telas dele sobem ao condomínio). Usa a mesma consulta do formulário (uma só chamada).
 */
export function BlockHeader({ blockId }: { blockId: string }) {
  const { data: block } = useBlocksRetrieve(blockId);

  return (
    <div className="mb-6">
      <CondominiumBackLink blockId={blockId} />
      {block ? (
        <h1 className="text-title">
          <span className="text-ink-faint">Bloco · </span>
          {block.name}
        </h1>
      ) : (
        <Skeleton className="h-9 w-56 rounded-control" />
      )}
    </div>
  );
}
