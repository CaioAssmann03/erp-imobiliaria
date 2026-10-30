"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { DateSelect } from "@/components/DateSelect";
import { ShowMore } from "@/components/data-list";
import { ScopeDivider, ScopeSearchCard, ScopeSearchRow } from "@/components/ScopeSearchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCompanyEntriesList } from "@/lib/api/generated";
import { todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CompanyEntryListItem } from "./CompanyEntryListItem";

const SEGMENT = "flex-1 px-3 hover:bg-ink/5";

/**
 * Client Component: a coluna da esquerda da conta da imobiliária, no padrão da lista de condomínios: o título, o período (de e até, calendários de
 * dias, `DateSelect`) num cartão com a busca pela descrição embaixo, e os lançamentos do mais recente ao mais antigo, 10 de cada vez, com o aberto
 * marcado. Não há **+**: os lançamentos nascem do pagamento de um boleto com tarifa.
 */
export function CompanyEntriesList({ openEntryId, className }: { openEntryId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${from}|${until}`);
  const { data, isLoading, isPlaceholderData } = useCompanyEntriesList(
    {
      limit,
      ...(term ? { query: term } : {}),
      ...(from ? { entry_date__gte: from } : {}),
      ...(until ? { entry_date__lte: until } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const today = todayIso();

  return (
    <aside
      aria-label="Conta da imobiliária"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="px-1">
        <h2 className="text-heading">Conta da imobiliária</h2>
      </div>

      <ScopeSearchCard
        scopes={
          <>
            <DateSelect className={SEGMENT} label="Data inicial" value={from} today={today} placeholder="A partir de" allLabel="Sem data inicial" onChange={setFrom} />
            <ScopeDivider />
            <DateSelect className={SEGMENT} label="Data final" value={until} today={today} placeholder="Até" allLabel="Sem data final" onChange={setUntil} />
          </>
        }
      >
        <ScopeSearchRow>
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar lançamento pela descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pela descrição"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </ScopeSearchRow>
      </ScopeSearchCard>

      <nav aria-label="Lista de lançamentos" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {term || from || until ? "Nenhum lançamento com esses filtros." : "Nenhum lançamento da imobiliária ainda."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((entry) => (
              <CompanyEntryListItem key={entry.id} entry={entry} isOpen={entry.id === openEntryId} dimmed={Boolean(openEntryId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="lançamento(s)" onMore={showMore} />}
    </aside>
  );
}
