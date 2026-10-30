"use client";

import { useSearchParams } from "next/navigation";

import { BackLink } from "@/components/BackLink";
import { StatusText } from "@/components/StatusText";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonsRetrieve } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { backTargetOf } from "@/lib/back-target";
import { condominiumUrl } from "@/lib/condominium-registry";
import { originCondominium, personsUrl } from "@/lib/person-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação da pessoa aberta, a situação em texto simples (verde ativo,
 * preto inativo). Usa a mesma consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. Em cima do nome tem o "voltar", sempre
 * uma ação antes: à tela de onde se chegou (`?from=`: a unidade, as pessoas do condomínio...), ou ao condomínio pelo qual a lista estava filtrada;
 * sem origem, à lista de pessoas, só no celular (no desktop a lista já está ao lado).
 */
export function PersonHeader({ personId }: { personId: string }) {
  const { data: person } = usePersonsRetrieve(personId);
  const search = useSearchParams();
  const condominiumId = originCondominium(search.get("condominium"));
  // A tela de onde se chegou (`?from=`); sem ela, o condomínio pelo qual a lista estava filtrada; sem nenhum, só a lista no celular.
  const target = backTargetOf(search.get("from")) ?? (condominiumId ? { href: condominiumUrl(condominiumId), label: "Condomínio" } : null);

  const back = target ? (
    <BackLink href={target.href} label={target.label} />
  ) : (
    <div className="lg:hidden">
      <BackLink href={personsUrl()} label="Pessoas" />
    </div>
  );

  if (!person)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  return (
    <>
      {back}
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-title">
          <span className="tabular-nums text-ink-faint">{formatCode(person.code)}</span>
          <span className="text-ink-faint"> · </span>
          {person.name}
        </h1>
        <StatusText active={person.active ?? true} />
      </div>
    </>
  );
}
