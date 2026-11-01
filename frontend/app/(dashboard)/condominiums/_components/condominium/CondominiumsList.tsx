"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useCondominiumsList } from "@/lib/api/generated";
import type { CondominiumsListPending } from "@/lib/api/generated/models";
import { CONDOMINIUM_PENDING_OPTIONS, condominiumPageUrl, condominiumPendingParam, selectedCondominiumId, selectedCondominiumPage } from "@/lib/condominiums/condominium-registry";
import { RegistryCreate, RegistryList, RegistryListItem } from "@/components/layout/RegistryList";
import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { RegistrySearch } from "@/components/filters/RegistrySearch";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { formatCode } from "@/lib/format/format";

/**
 * Client Component: a coluna da esquerda do cadastro, a lista de condomínios com busca por nome ou código. Marca o condomínio aberto.
 * Ao trocar de condomínio fica na tela própria em que se está (blocos, unidades ou sub-contas), agora a do condomínio escolhido; da página de dados vai à página de dados.
 * O filtro de pendência está no filtro compacto dentro da busca (ícone com a bolinha, como nas outras listas); `?pending=` (do dashboard → Pendências) abre a lista
 * já filtrada por ele.
 */
export function CondominiumsList({ className }: { className?: string }) {
  const pathname = usePathname();
  const urlPending = condominiumPendingParam(useSearchParams().get("pending"));
  const [pending, setPending] = useState(urlPending);
  const [seenUrlPending, setSeenUrlPending] = useState(urlPending);
  if (urlPending !== seenUrlPending) {
    setSeenUrlPending(urlPending);
    if (urlPending) setPending(urlPending);
  }
  const selectedId = selectedCondominiumId(pathname);
  const openPage = selectedCondominiumPage(pathname);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${term}|${pending}`);
  const { data, isLoading, isPlaceholderData } = useCondominiumsList(
    {
      limit,
      ...(term ? { query: term } : {}),
      ...(pending ? { pending: pending as CondominiumsListPending } : {}),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const groups: CompactFilterGroup[] = [{ key: "pending", label: "Pendência", value: pending, onChange: setPending, options: CONDOMINIUM_PENDING_OPTIONS }];

  return (
    <RegistryList
      label="Condomínios"
      title="Condomínios"
      actions={<RegistryCreate href="/condominiums/new" label="Novo condomínio" />}
      toolbar={
        <ScopeSearchCard>
          <RegistrySearch label="Buscar condomínio por código ou nome" placeholder="Código ou nome" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={() => setPending("")} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de condomínios"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={term || pending ? "Nenhum condomínio com esses filtros." : "Nenhum condomínio encontrado."}
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
