"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { DateSelect } from "@/components/dates/DateSelect";
import { ShowMore } from "@/components/data-list";
import { ScopeDivider, ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCompanyEntriesList } from "@/lib/api/generated";
import { todayIso } from "@/lib/format/format";
import { RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";

import { CompanyEntryListItem } from "./CompanyEntryListItem";

const SEGMENT = "flex-1 px-3 hover:bg-ink/5";

/**
 * Client Component: a coluna da esquerda da conta da imobiliária, no padrão da lista de condomínios: o título e, num cartão, o seletor de condomínio com caixa de
 * busca ("Todos os condomínios" não filtra) e embaixo o período (de e até, calendários de dias, `DateSelect`); depois os lançamentos do mais recente ao mais antigo,
 * 10 de cada vez, com o aberto marcado. Não há **+**: os lançamentos nascem do pagamento de um boleto com tarifa.
 */
export function CompanyEntriesList({ openEntryId, className }: { openEntryId: string | null; className?: string }) {
  const [condominium, setCondominium] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");


  const { limit, showMore } = useGrowingLimit(`${condominium}|${from}|${until}`);
  const { data, isLoading, isPlaceholderData } = useCompanyEntriesList(
    {
      limit,
      ...(condominium ? { condominium } : {}),
      ...(from ? { entry_date__gte: from } : {}),
      ...(until ? { entry_date__lte: until } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const today = todayIso();

  return (
    <RegistryList
      label="Conta da imobiliária"
      title="Conta da imobiliária"
      toolbar={
        <ScopeSearchCard scopes={<CondominiumScopeSelect value={condominium} allLabel="Todos os condomínios" onChange={setCondominium} />}>
          <ScopeSearchRow className="p-0">
            <DateSelect className={SEGMENT} label="Data inicial" value={from} today={today} placeholder="A partir de" allLabel="Sem data inicial" onChange={setFrom} />
            <ScopeDivider />
            <DateSelect className={SEGMENT} label="Data final" value={until} today={today} placeholder="Até" allLabel="Sem data final" onChange={setUntil} />
          </ScopeSearchRow>
        </ScopeSearchCard>
      }
      navLabel="Lista de lançamentos"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={condominium || from || until ? "Nenhum lançamento com esses filtros." : "Nenhum lançamento da imobiliária ainda."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="lançamento(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((entry) => (
        <CompanyEntryListItem key={entry.id} entry={entry} isOpen={entry.id === openEntryId} dimmed={Boolean(openEntryId)} />
      ))}
    </RegistryList>
  );
}
