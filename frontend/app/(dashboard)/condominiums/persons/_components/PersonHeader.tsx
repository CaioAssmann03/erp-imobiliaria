"use client";

import { BackLink } from "@/components/BackLink";
import { StatusText } from "@/components/StatusText";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonsRetrieve } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { personsUrl } from "@/lib/person-workspace";

/**
 * Client Component: o código (cinza, como na lista ao lado), o nome e a situação da pessoa aberta, a situação em texto simples (verde ativo,
 * preto inativo). Usa a mesma consulta do formulário (uma só chamada); o Excluir fica na barra de ações dele. No celular, onde a lista não fica
 * ao lado, tem o "voltar" à lista no alto.
 */
export function PersonHeader({ personId }: { personId: string }) {
  const { data: person } = usePersonsRetrieve(personId);

  const back = (
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
