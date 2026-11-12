"use client";

import { useSearchParams } from "next/navigation";

import { BackLink, PhoneBackLink } from "@/components/layout/BackLink";
import { RegistryHeader } from "@/components/layout/RegistryHeader";
import { usePersonsRetrieve } from "@/lib/api/generated";
import { backTargetOf } from "@/lib/navigation/back-target";
import { condominiumUrl } from "@/lib/condominiums/condominium-registry";
import { originCondominium, personsUrl } from "@/lib/persons/person-workspace";

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

  return (
    <RegistryHeader
      back={target ? <BackLink href={target.href} label={target.label} /> : <PhoneBackLink href={personsUrl()} label="Pessoas" />}
      record={person && { code: person.code, name: person.name, active: person.active ?? true }}
    />
  );
}
