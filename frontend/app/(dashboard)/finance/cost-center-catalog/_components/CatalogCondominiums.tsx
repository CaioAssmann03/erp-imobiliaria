"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { FormSection } from "@/components/form/FormSection";
import { PageControls } from "@/components/data-list/PageControls";
import { useCostCentersList } from "@/lib/api/generated";
import { condominiumUrl } from "@/lib/condominiums/condominium-registry";

/** Quantos condomínios a seção mostra por página: uma sub-conta pode ser usada por dezenas deles. */
export const CATALOG_CONDOMINIUMS_PAGE_SIZE = 7;

/**
 * Client Component: os condomínios que usam esta sub-conta (cada um com a dele, que só difere no saldo), 7 por página, cada nome levando ao
 * cadastro do condomínio. Uma sub-conta desativada num condomínio continua na lista, marcada: ainda é uma ligação. Quem a usa muda ao trocar de
 * sub-conta: o componente deve vir com a `key` dela, para a página voltar à primeira.
 */
export function CatalogCondominiums({ itemId }: { itemId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useCostCentersList(
    { catalog_item: itemId, limit: CATALOG_CONDOMINIUMS_PAGE_SIZE, page },
    { query: { placeholderData: keepPreviousData } }
  );
  const rows = data?.results ?? [];
  const count = data?.count ?? 0;
  const pageCount = Math.max(Math.ceil(count / CATALOG_CONDOMINIUMS_PAGE_SIZE), 1);

  return (
    <FormSection title="Condomínios" description="Quem usa esta sub-conta. Cada condomínio tem a sua, com o próprio saldo.">
      {isLoading ? (
        <p className="text-body text-ink-soft">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="text-body text-ink-soft">Nenhum condomínio usa esta sub-conta ainda.</p>
      ) : (
        <>
          <ul className={isPlaceholderData ? "-mx-3 opacity-60 transition-opacity" : "-mx-3 transition-opacity"}>
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={condominiumUrl(row.condominium)}
                  className="flex items-baseline justify-between gap-3 rounded-panel px-3 py-2 text-body transition-colors hover:bg-surface-muted"
                >
                  <span className="min-w-0 truncate">{row.condominium_name}</span>
                  {row.active === false && <span className="shrink-0 text-caption text-ink-faint">Desativada</span>}
                </Link>
              </li>
            ))}
          </ul>
          {pageCount > 1 && <PageControls page={page} pageCount={pageCount} pageSize={CATALOG_CONDOMINIUMS_PAGE_SIZE} count={count} onPage={setPage} />}
        </>
      )}
    </FormSection>
  );
}
