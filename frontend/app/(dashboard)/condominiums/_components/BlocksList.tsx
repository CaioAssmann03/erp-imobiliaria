"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CompactFilter } from "@/components/CompactFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlocksList, useCondominiumsList } from "@/lib/api/generated";
import { newBlockUrl } from "@/lib/block-workspace";
import { cn } from "@/lib/utils";

import { BlockListItem } from "./BlockListItem";

/**
 * Client Component: a coluna da esquerda do cadastro e da edição de um bloco, a lista dos blocos do condomínio dele no mesmo padrão
 * da lista de condomínios, com o aberto marcado. A escolha do condomínio fica no ícone de filtro dentro da busca (`CompactFilter`) e troca a
 * lista (e o **+**) sem sair da tela; o condomínio da lista se lê numa linha abaixo. Sem `condominiumId` (a edição ainda carregando o bloco)
 * mostra só o esqueleto.
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
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const activeCondominium = chosen ?? condominiumId;
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data, isLoading } = useBlocksList(
    { condominium: activeCondominium ?? undefined, limit: 100 },
    { query: { enabled: Boolean(activeCondominium) } }
  );

  const term = search.trim().toLowerCase();
  const all = data?.results ?? [];
  const results = term ? all.filter((block) => block.name.toLowerCase().includes(term)) : all;
  const loading = !activeCondominium || isLoading;
  const activeCondominiumData = condominiums?.results.find((condominium) => condominium.id === activeCondominium);
  const condominiumLabel = activeCondominiumData
    ? `${String(activeCondominiumData.code).padStart(4, "0")} · ${activeCondominiumData.name}`
    : null;

  return (
    <aside
      aria-label="Blocos"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-80 2xl:w-96",
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

      <div className="flex h-10 items-center gap-2 rounded-control bg-surface pr-1.5 pl-3 text-ink-soft shadow-card focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="size-4 shrink-0" />
        <input
          type="search"
          aria-label="Buscar bloco"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome do bloco"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
        <CompactFilter
          groups={[
            {
              key: "condominium",
              label: "Condomínio",
              required: true,
              value: activeCondominium ?? "",
              onChange: (value) => {
                setChosen(value || null);
                setSearch("");
              },
              options: (condominiums?.results ?? []).map((condominium) => ({
                value: condominium.id,
                label: `${String(condominium.code).padStart(4, "0")} · ${condominium.name}`,
              })),
            },
          ]}
          onClear={() => setChosen(null)}
        />
      </div>
      {condominiumLabel && <p className="truncate px-1 text-caption text-ink-soft">{condominiumLabel}</p>}

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
              <BlockListItem key={block.id} block={block} isOpen={block.id === openBlockId} dimmed={results.some((item) => item.id === openBlockId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <p className="px-1 text-center text-caption text-ink-soft">{`${data.count} bloco(s)`}</p>}
    </aside>
  );
}
