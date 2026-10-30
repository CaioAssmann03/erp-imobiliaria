"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { backTargetOf } from "@/lib/navigation/back-target";
import { useBlocksList, useCondominiumsList } from "@/lib/api/generated";
import { newBlockUrl } from "@/lib/condominiums/block-workspace";
import { cn } from "@/lib/utils";

import { BlockListItem } from "./BlockListItem";

/**
 * Client Component: a coluna da esquerda do cadastro e da edição de um bloco, a lista dos blocos do condomínio dele no mesmo padrão
 * da lista de condomínios, com o aberto marcado. O condomínio é o seletor numa linha abaixo do título, como na coluna de unidades: trocar leva a lista (e o
 * **+**) para o outro sem sair da tela. Sem `condominiumId` (a edição ainda carregando o bloco) mostra só o esqueleto.
 */
export function BlocksList({
  condominiumId,
  openBlockId,
  className,
}: {
  condominiumId: string | null;
  openBlockId: string | null;
  className?: string;
}) {
  // A origem com que o bloco foi aberto segue ao trocar de bloco pela lista: o "voltar" continua levando a ela.
  const from = backTargetOf(useSearchParams().get("from"))?.href ?? null;
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const activeCondominium = chosen ?? condominiumId;
  const term = useDebouncedValue(search.trim());
  const { limit, showMore } = useGrowingLimit(`${term}|${activeCondominium}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data, isLoading } = useBlocksList(
    { condominium: activeCondominium ?? undefined, limit, ...(term ? { query: term } : {}) },
    { query: { enabled: Boolean(activeCondominium) } }
  );
  const results = data?.results ?? [];
  const loading = !activeCondominium || isLoading;

  return (
    <aside
      aria-label="Blocos"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Blocos</h2>
        {activeCondominium ? (
          <Link
            href={newBlockUrl(activeCondominium)}
            aria-label="Novo bloco"
            title="Novo bloco"
            className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
          </Link>
        ) : (
          <span aria-disabled="true" className="flex size-8 items-center justify-center text-ink-soft opacity-40">
            <Plus className="size-5" />
          </span>
        )}
      </div>

      <ScopeSearchCard
        scopes={
          <ScopeSelect
            variant="segment"
            className="flex-1"
            label="Condomínio"
            value={activeCondominium ?? ""}
            placeholder="Selecione o condomínio"
            onChange={(value) => {
              setChosen(value || null);
              setSearch("");
            }}
            options={(condominiums?.results ?? []).map((condominium) => ({
              value: condominium.id,
              label: `${String(condominium.code).padStart(4, "0")} · ${condominium.name}`,
              title: condominium.name,
            }))}
          />
        }
      >
        <ScopeSearchRow>
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar bloco"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome do bloco"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </ScopeSearchRow>
      </ScopeSearchCard>

      <nav aria-label="Lista de blocos" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-11 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {term ? "Nenhum bloco com esse nome." : "Este condomínio ainda não tem blocos."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((block) => (
              <BlockListItem key={block.id} block={block} isOpen={block.id === openBlockId} dimmed={Boolean(openBlockId)} from={from} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="bloco(s)" onMore={showMore} />}
    </aside>
  );
}
