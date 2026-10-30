"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { DateSelect } from "@/components/dates/DateSelect";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList, useEntryBatchesList } from "@/lib/api/generated";
import type { EntryBatchesListOrigin } from "@/lib/api/generated/models";
import { newEntryBatchUrl } from "@/lib/finance/entry-batch-workspace";
import { todayIso } from "@/lib/format/format";
import { BATCH_ORIGINS } from "@/lib/schemas/entry-batch";
import { cn } from "@/lib/utils";

import { EntryBatchListItem } from "./EntryBatchListItem";

/**
 * Client Component: a coluna da esquerda do lançamento manual, no padrão da lista de condomínios: título com **+** de novo lote, o condomínio como escopo (seletor,
 * "Todos os condomínios": os lotes que têm lançamento dele), abaixo a data do lote (calendário de dias, `DateSelect`, como o `MonthSelect`) com o filtro
 * discreto de origem (`CompactFilter`) e os lotes do mais recente ao mais antigo, 10 de cada vez, com o aberto marcado. Um lote nunca se exclui.
 */
export function EntryBatchesList({ openBatchId, className }: { openBatchId: string | null; className?: string }) {
  const [condominium, setCondominium] = useState("");
  const [origin, setOrigin] = useState("");
  const [date, setDate] = useState("");

  const { limit, showMore } = useGrowingLimit(`${condominium}|${origin}|${date}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
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
    <aside
      aria-label="Lançamento manual"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Lançamento manual</h2>
        <Link
          href={newEntryBatchUrl()}
          aria-label="Novo lote"
          title="Novo lote"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <ScopeSearchCard
        scopes={
          <ScopeSelect
            variant="segment"
            className="flex-1"
            label="Condomínio"
            value={condominium}
            allLabel="Todos os condomínios"
            onChange={setCondominium}
            options={(condominiums?.results ?? []).map((item) => ({
              value: item.id,
              label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
              title: item.name,
            }))}
          />
        }
      >
        <ScopeSearchRow>
          <DateSelect
            className="flex-1"
            label="Data do lote"
            value={date}
            today={todayIso()}
            placeholder="Filtrar pela data"
            allLabel="Todas as datas"
            onChange={setDate}
          />
          <CompactFilter groups={groups} onClear={() => setOrigin("")} />
        </ScopeSearchRow>
      </ScopeSearchCard>

      <nav aria-label="Lista de lotes" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{condominium || origin || date ? "Nenhum lote com esse filtro." : "Nenhum lançamento manual ainda."}</p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((batch) => (
              <EntryBatchListItem key={batch.id} batch={batch} isOpen={batch.id === openBatchId} dimmed={Boolean(openBatchId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="lote(s)" onMore={showMore} />}
    </aside>
  );
}
