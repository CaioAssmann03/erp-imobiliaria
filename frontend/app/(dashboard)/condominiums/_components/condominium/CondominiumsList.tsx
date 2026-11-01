"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList } from "@/lib/api/generated";
import type { CondominiumsListPending } from "@/lib/api/generated/models";
import { condominiumPageUrl, selectedCondominiumId, selectedCondominiumPage } from "@/lib/condominiums/condominium-registry";
import { RegistryCreate, RegistryList, RegistryListItem } from "@/components/layout/RegistryList";
import { RegistrySearch } from "@/components/filters/RegistrySearch";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { formatCode } from "@/lib/format/format";

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
    <RegistryList
      label="Condomínios"
      title="Condomínios"
      actions={<RegistryCreate href="/condominiums/new" label="Novo condomínio" />}
      toolbar={
        <>
          <ScopeSearchCard>
            <RegistrySearch label="Buscar condomínio por código ou nome" placeholder="Código ou nome" value={search} onChange={setSearch} />
          </ScopeSearchCard>
          {pending && (
            <div className="flex items-center justify-between gap-2 rounded-panel bg-warning-soft px-3 py-2 text-caption">
              <span>Filtrado por pendência</span>
              <Link href="/condominiums" className="font-medium underline underline-offset-2">
                Limpar
              </Link>
            </div>
          )}
        </>
      }
      navLabel="Lista de condomínios"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage="Nenhum condomínio encontrado."
      footer={data && <ShowMore shown={results.length} total={data.count} noun="condomínio(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((condominium) => {
        const city = condominium.address?.city ? `${condominium.address.city}/${condominium.address.state}` : null;
        return (
          <RegistryListItem
            key={condominium.id}
            href={openPage ? condominiumPageUrl(condominium.id, openPage) : `/condominiums/${condominium.id}`}
            isOpen={condominium.id === selectedId}
            dimmed={Boolean(selectedId)}
          >
            <span className="block truncate text-body font-medium">
              <span className="tabular-nums">{formatCode(condominium.code)}</span>
              <span className="text-ink-faint"> · </span>
              {condominium.name}
            </span>
            <span className="block truncate text-caption text-ink-soft">{[city, condominium.active ? null : "Inativo"].filter(Boolean).join(" · ") || "—"}</span>
          </RegistryListItem>
        );
      })}
    </RegistryList>
  );
}
