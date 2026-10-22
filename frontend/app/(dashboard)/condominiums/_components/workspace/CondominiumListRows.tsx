"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CondominiumListState } from "@/hooks/use-condominium-list";
import { formatCondominiumCode, unitCountLabel } from "@/lib/condominium-list";
import { cn } from "@/lib/utils";

/** As linhas do painel, com a seleção em destaque e o carregamento do restante ao rolar até o fim. */
export function CondominiumListRows({ list, selectedId }: { list: CondominiumListState; selectedId?: string }) {
  const { rows, query } = list;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const moreButton = useRef<HTMLButtonElement>(null);

  // O botão "Mostrar mais" carrega a próxima página sozinho quando a rolagem chega nele.
  useEffect(() => {
    const button = moreButton.current;
    if (!button || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void fetchNextPage();
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rows.length]);

  // O condomínio aberto fica à vista na lista.
  useEffect(() => {
    if (selectedId) document.getElementById(`condominium-row-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId, rows.length]);

  if (query.isLoading) {
    return (
      <div className="space-y-1 px-2 pb-2" aria-busy="true" aria-label="Carregando condomínios">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-1.5 px-3 py-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="px-4 pb-4 text-center">
        <p className="text-body text-ink-soft">Não foi possível carregar a lista.</p>
        <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => void query.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="px-4 pb-4 text-center text-body text-ink-soft">Nenhum condomínio encontrado.</p>;
  }

  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-2 pb-2 transition-opacity", query.isPlaceholderData && "opacity-60")}>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              id={`condominium-row-${row.id}`}
              href={`/condominiums/${row.id}`}
              aria-current={row.id === selectedId ? "page" : undefined}
              className={cn(
                "block rounded-control px-3 py-2 outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand/50",
                row.id === selectedId && "bg-surface-muted",
                !row.active && "text-ink-faint",
              )}
            >
              <span className={cn("block truncate text-body", row.id === selectedId && "font-medium")}>
                {formatCondominiumCode(row.code)} - {row.name}
              </span>
              <span className="block text-caption text-ink-soft tabular-nums">
                {unitCountLabel(row.unit_count)}
                {row.active ? "" : " · Inativo"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <Button
          ref={moreButton}
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 w-full text-ink-soft"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {isFetchingNextPage ? "Carregando…" : "Mostrar mais"}
        </Button>
      )}
    </div>
  );
}
