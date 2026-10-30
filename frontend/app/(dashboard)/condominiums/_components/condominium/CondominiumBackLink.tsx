"use client";

import { useSearchParams } from "next/navigation";

import { BackLink } from "@/components/BackLink";
import { useBlocksRetrieve, useCostCentersRetrieve } from "@/lib/api/generated";
import { backTargetOf } from "@/lib/back-target";
import { condominiumUrl } from "@/lib/condominium-registry";

/**
 * Client Component: o "voltar" da edição de um bloco ou de uma sub-conta: leva à página do condomínio dela, que fica marcado na lista de
 * condomínios. O condomínio vem do próprio registro (a mesma consulta do formulário); enquanto carrega, só reserva o lugar.
 */
export function CondominiumBackLink({ blockId, costCenterId }: { blockId?: string; costCenterId?: string }) {
  const { data: block } = useBlocksRetrieve(blockId ?? "", { query: { enabled: Boolean(blockId) } });
  const { data: costCenter } = useCostCentersRetrieve(costCenterId ?? "", { query: { enabled: Boolean(costCenterId) } });
  const condominiumId = block?.condominium ?? costCenter?.condominium;

  // A tela de onde se chegou (`?from=`: a lista de blocos, as unidades...); sem ela, o condomínio.
  const from = backTargetOf(useSearchParams().get("from"));

  if (from) return <BackLink href={from.href} label={from.label} />;
  if (!condominiumId) return <span aria-hidden className="mb-2 block h-7" />;
  return <BackLink href={condominiumUrl(condominiumId)} label="Condomínio" />;
}
