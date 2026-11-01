"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { DateSelect } from "@/components/dates/DateSelect";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useEntryBatchesList } from "@/lib/api/generated";
import type { EntryBatchesListOrigin } from "@/lib/api/generated/models";
import { newEntryBatchUrl } from "@/lib/finance/entry-batch-workspace";
import { todayIso } from "@/lib/format/format";
import { BATCH_ORIGINS } from "@/lib/schemas/entry-batch";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";

import { EntryBatchListItem } from "./EntryBatchListItem";

/**
 * Client Component: a coluna da esquerda do lançamento manual, no padrão da lista de condomínios: título com **+** de novo lote, o condomínio como escopo (seletor, que abre em
 * "Todos os condomínios"; escolher um mostra os lotes que têm lançamento dele), abaixo a data do lote (digitável em `dd/mm/aaaa` ou pelo calendário de dias, `DateSelect`, como o `MonthSelect`) com o filtro
 * discreto de origem (`CompactFilter`) e os lotes do mais recente ao mais antigo, 10 de cada vez, com o aberto marcado. Um lote nunca se exclui.
 */
export function EntryBatchesList({ openBatchId, className }: { openBatchId: string | null; className?: string }) {
  const [condominium, setCondominium] = useState("");
  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");

  const { limit, showMore } = useGrowingLimit(`${condominium}|${origin}|${date}`);
  const { data, isLoading, isPlaceholderData } = useEntryBatchesList(
    {
      limit,
      ...(condominium ? { condominium } : {}),
      ...(origin ? { origin: origin as EntryBatchesListOrigin } : {}),
      ...(date ? { batch_date: date } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

  const groups: CompactFilterGroup[] = [{ key: "origin", label: "Origem", value: origin, onChange: setOrigin, options: BATCH_ORIGINS }];

  return (
    <RegistryList
      label="Lançamento manual"
      title="Lançamento manual"
      actions={<RegistryCreate href={newEntryBatchUrl()} label="Novo lote" />}
      toolbar={
        <ScopeSearchCard scopes={<CondominiumScopeSelect value={condominium} allLabel="Todos os condomínios" onChange={setCondominium} />}>
          <ScopeSearchRow>
            <DateSelect
              className="flex-1"
              label="Data do lote"
              value={date}
              today={todayIso()}
              placeholder="Digite ou escolha a data"
              allLabel="Todas as datas"
              onChange={setDate}
            />
            <CompactFilter groups={groups} onClear={() => setOrigin("")} />
          </ScopeSearchRow>
        </ScopeSearchCard>
      }
      navLabel="Lista de lotes"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={condominium || origin || date ? "Nenhum lote com esse filtro." : "Nenhum lançamento manual ainda."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="lote(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((batch) => (
        <EntryBatchListItem key={batch.id} batch={batch} isOpen={batch.id === openBatchId} dimmed={Boolean(openBatchId)} />
      ))}
    </RegistryList>
  );
}
