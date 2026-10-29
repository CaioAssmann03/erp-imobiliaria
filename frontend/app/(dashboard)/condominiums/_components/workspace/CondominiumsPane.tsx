"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { LinkButton } from "@/components/LinkButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCondominiumsList } from "@/lib/api/generated";
import type { CondominiumsListPending } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

import { selectedCondominiumId } from "./reserved-segments";

const PAGE_SIZE = 40;

/**
 * Client Component: a lista de condomínios sempre visível à esquerda. Busca no servidor (nome, CNPJ ou ID);
 * `?pending=` (de "Pendências" no dashboard) filtra a lista e dá para limpar.
 */
export function CondominiumsPane() {
  const pathname = usePathname();
  const pending = useSearchParams().get("pending") ?? undefined;
  const selectedId = selectedCondominiumId(pathname);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, isLoading } = useCondominiumsList(
    {
      limit,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(pending ? { pending: pending as CondominiumsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-heading">Condomínios</h1>
        <LinkButton
          href="/condominiums/new"
          variant="ghost"
          size="icon"
          aria-label="Novo condomínio"
          title="Novo condomínio"
          className="text-ink-soft hover:text-ink"
        >
          <Plus className="size-4" />
        </LinkButton>
      </div>

      <label className="relative block">
        <span className="sr-only">Buscar condomínio</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder="Buscar condomínio"
          autoComplete="off"
          className="h-9 w-full rounded-control bg-surface-muted pr-3 pl-9 text-body outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-brand/50"
        />
      </label>

      {pending && (
        <p className="flex items-center justify-between gap-2 px-1 text-caption text-ink-soft">
          Filtrado por pendência
          <Link href="/condominiums" className="text-ink underline">
            Limpar
          </Link>
        </p>
      )}

      <nav aria-label="Condomínios" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Nenhum condomínio encontrado.</p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((condominium) => {
              const active = condominium.id === selectedId;
              const city = condominium.address?.city
                ? `${condominium.address.city}/${condominium.address.state}`
                : null;
              return (
                <li key={condominium.id}>
                  <Link
                    href={`/condominiums/${condominium.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-panel px-3 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                      active ? "bg-surface-sunken/70 text-ink" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    <span className={cn("block truncate text-body", active && "font-medium")}>
                      {condominium.name}
                    </span>
                    <span className="block truncate text-caption text-ink-faint tabular-nums">
                      {[String(condominium.code).padStart(4, "0"), city, condominium.active ? null : "Inativo"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {data && data.count > results.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-ink-soft"
            onClick={() => setLimit((current) => current + PAGE_SIZE)}
          >
            Mostrar mais ({data.count - results.length})
          </Button>
        )}
      </nav>

    </div>
  );
}
