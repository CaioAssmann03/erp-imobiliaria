"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { ScopeDivider, ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { SCOPE_SELECT_MAX_RESULTS, ScopeSelect, type ScopeOption } from "@/components/filters/ScopeSelect";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingDocumentsList, useCondominiumPeopleList, useUnitsList } from "@/lib/api/generated";
import { extraBillingUrl, newExtraBillingUrl } from "@/lib/billing/extra-billing-workspace";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";

import { ExtraBillingListItem } from "./ExtraBillingListItem";
import { useExtraScope } from "./use-extra-scope";

/** Quantas unidades e quantas pessoas o seletor pede à API de cada vez: metade das opções que ele mostra, para as duas aparecerem juntas. */
const OPTIONS_PER_KIND = SCOPE_SELECT_MAX_RESULTS / 2;

/** O filtro escolhido no seletor vira o parâmetro da API (`unit` ou `payer`). */
function filterParams(filter: string): { unit?: string; payer?: string } {
  const [kind, id] = filter.split(":");
  if (!id) return {};
  return kind === "unit" ? { unit: id } : { payer: id };
}

/**
 * Client Component: a coluna da esquerda do boleto extra, no padrão da lista de condomínios: título com **+** de novo boleto, o condomínio como escopo
 * (seletor; fica na URL, então o formulário e o boleto aberto o seguem), ao lado dele um seletor com caixa de busca (feita na API: as unidades do condomínio e as pessoas
 * com vínculo vigente com elas, que são os pagadores) (escolher um filtra a lista) e os boletos extras já emitidos, os mais novos primeiro, 10 de cada vez, com o aberto marcado.
 */
export function ExtraBillingList({ openDocumentId, isNew = false, className }: { openDocumentId: string | null; /** Num boleto novo, escolher outro condomínio aqui abre o boleto novo dele (e não a tela vazia), para a tela e a lista andarem juntas. */ isNew?: boolean; className?: string }) {
  const router = useRouter();
  const scope = useExtraScope();
  // O filtro vale só para o condomínio em que foi escolhido: trocar de condomínio o limpa.
  const [picked, setPicked] = useState({ condominium: "", value: "", label: "" });
  const filter = picked.condominium === scope.condominium ? picked.value : "";
  const [optionSearch, setOptionSearch] = useState("");
  const optionTerm = useDebouncedValue(optionSearch.trim());

  const hasScope = scope.condominium !== "";
  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${filter}`);
  const optionParams = { condominium: scope.condominium, limit: OPTIONS_PER_KIND, ...(optionTerm ? { query: optionTerm } : {}) };
  const { data: unitMatches } = useUnitsList(optionParams, { query: { enabled: hasScope, placeholderData: keepPreviousData } });
  const { data: payerMatches } = useCondominiumPeopleList(optionParams, { query: { enabled: hasScope, placeholderData: keepPreviousData } });
  // A opção escolhida continua na lista mesmo quando a busca digitada depois não a traz.
  const found: ScopeOption[] = [
    ...(unitMatches?.results ?? []).map((unit): ScopeOption => ({ value: `unit:${unit.id}`, label: `Unidade ${unit.name}` })),
    ...(payerMatches?.results ?? []).map((person): ScopeOption => ({ value: `payer:${person.id}`, label: `Pagador ${person.name}`, title: person.name })),
  ];
  const filterOptions = filter && !found.some((option) => option.value === filter) ? [{ value: filter, label: picked.label }, ...found] : found;
  const { data, isLoading, isPlaceholderData } = useBillingDocumentsList(
    { condominium: scope.condominium, kind: "extra", limit, ...filterParams(filter) },
    { query: { enabled: hasScope, placeholderData: keepPreviousData } }
  );
  const documents = data?.results ?? [];

  return (
    <RegistryList
      label="Boleto extra"
      title="Boleto extra"
      actions={
        <RegistryCreate href={newExtraBillingUrl(scope)} label="Novo boleto extra" />
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <>
              <CondominiumScopeSelect value={scope.condominium} onChange={(condominium) => router.push(isNew && condominium ? newExtraBillingUrl({ condominium }) : extraBillingUrl({ condominium }))} />
              {hasScope && (
                <>
                  <ScopeDivider />
                  <ScopeSelect
                    variant="segment"
                    className="w-28"
                    label="Unidade ou pagador"
                    value={filter}
                    placeholder="Unidade ou pagador"
                    allLabel="Todos"
                    options={filterOptions}
                    onSearch={setOptionSearch}
                    onChange={(value) => setPicked({ condominium: scope.condominium, value, label: filterOptions.find((option) => option.value === value)?.label ?? "" })}
                  />
                </>
              )}
            </>
          }
        />
      }
      navLabel="Lista de boletos extras"
      blocked={hasScope ? null : "Escolha o condomínio para ver os boletos extras dele."}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={documents.length === 0}
      emptyMessage={filter ? "Nenhum boleto extra para essa unidade ou pagador." : "Nenhum boleto extra emitido ainda."}
      footer={hasScope && data && <ShowMore shown={documents.length} total={data.count} noun="boleto(s)" onMore={showMore} />}
      className={className}
    >
      {documents.map((document) => (
        <ExtraBillingListItem key={document.id} document={document} scope={scope} isOpen={document.id === openDocumentId} dimmed={Boolean(openDocumentId)} />
      ))}
    </RegistryList>
  );
}
