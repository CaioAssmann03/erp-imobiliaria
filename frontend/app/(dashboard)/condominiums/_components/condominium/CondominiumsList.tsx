"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList } from "@/lib/api/generated";
import type { CondominiumsListPending } from "@/lib/api/generated/models";
import { condominiumPageUrl, selectedCondominiumId, selectedCondominiumPage } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";

/**
 * Client Component: a coluna da esquerda do cadastro, a lista de condomínios com busca por nome ou código. Marca o condomínio aberto.
 * Ao trocar de condomínio fica na tela própria em que se está (blocos, unidades ou sub-contas), agora a do condomínio escolhido; da página de dados vai à página de dados.
 * O filtro `?pending=` (do dashboard → Pendências) vem da URL e aparece como uma faixa que se limpa com um clique.
 */
export function CondominiumsList({ className }: { className?: string }) {
  const pathname = usePathname();
  const pending = useSearchParams().get("pending") ?? undefined;
  const selectedId = selectedCondominiumId(pathname);
  const openPage = selectedCondominiumPage(pathname);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${pending ?? ""}`);
  const { data, isLoading, isPlaceholderData } = useCondominiumsList(
    {
      limit,
      ...(term ? { query: term } : {}),
      ...(pending ? { pending: pending as CondominiumsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

  return (
    <aside
      aria-label="Condomínios"
      className={cn(
        "w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Condomínios</h2>
        <Link
          href="/condominiums/new"
          aria-label="Novo condomínio"
          title="Novo condomínio"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <label className="flex h-10 items-center gap-2 rounded-control bg-surface px-3 text-ink-soft shadow-card focus-within:ring-2 focus-within:ring-brand/50">
        <Search className="size-4 shrink-0" />
        <span className="sr-only">Buscar condomínio por código ou nome</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Código ou nome"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        />
      </label>

      {pending && (
        <div className="flex items-center justify-between gap-2 rounded-panel bg-warning-soft px-3 py-2 text-caption">
          <span>Filtrado por pendência</span>
          <Link href="/condominiums" className="font-medium underline underline-offset-2">
            Limpar
          </Link>
        </div>
      )}

      <nav
        aria-label="Lista de condomínios"
        className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Nenhum condomínio encontrado.</p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((condominium) => {
              const isSelected = condominium.id === selectedId;
              const city = condominium.address?.city
                ? `${condominium.address.city}/${condominium.address.state}`
                : null;
              return (
                <li key={condominium.id}>
                  <Link
                    href={openPage ? condominiumPageUrl(condominium.id, openPage) : `/condominiums/${condominium.id}`}
                    aria-current={isSelected ? "page" : undefined}
                    className={cn(
                      "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
                      isSelected && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
                      // Com um condomínio aberto, os outros ficam mais apagados (voltam ao passar o mouse ou focar).
                      selectedId && !isSelected && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
                    )}
                  >
                    <span className="block truncate text-body font-medium">
                      <span className="tabular-nums">{String(condominium.code).padStart(4, "0")}</span>
                      <span className="text-ink-faint"> · </span>
                      {condominium.name}
                    </span>
                    <span className="block truncate text-caption text-ink-soft">
                      {[city, condominium.active ? null : "Inativo"].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="condomínio(s)" onMore={showMore} />}
    </aside>
  );
}
