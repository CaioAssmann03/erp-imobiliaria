"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useUnitsRetrieve } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing-entry-payload";
import { formatDate } from "@/lib/format";
import { personUrl, UNIT_ROLE_LABELS } from "@/lib/person-workspace";

import { currentLinks } from "./current-links";

/**
 * Client Component: as pessoas da unidade aberta (o proprietário e o inquilino vigentes), numa sub-tela no meio, como as pessoas do condomínio, no
 * mesmo padrão visual (cartão branco, busca em pílula, linhas simples, 10 de cada vez). Cada linha diz o papel, a participação do proprietário e
 * desde quando; abrir uma leva à ficha da pessoa, cujo "voltar" retorna a esta tela. Lê a unidade pela mesma consulta do formulário.
 */
export function UnitPeopleList({ condominiumId, unitId }: { condominiumId: string; unitId: string }) {
  const here = useCurrentUrl();
  const [search, setSearch] = useState("");
  const { data: unit, isLoading } = useUnitsRetrieve(unitId);

  const links = unit ? [...currentLinks(unit)].sort((a, b) => a.person_detail.code - b.person_detail.code) : [];
  const term = search.trim().toLowerCase();
  const matches = term
    ? links.filter(({ person_detail: person }) => person.name.toLowerCase().includes(term) || formatCode(person.code).includes(term))
    : links;
  const { limit, showMore } = useGrowingLimit(`${term}|${unitId}`);
  const results = matches.slice(0, limit);

  return (
    <section aria-label="Pessoas da unidade" className="flex flex-col gap-3">
      <h2 className="px-1 text-heading">Pessoas</h2>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card">
        <label className="flex h-10 items-center gap-2 rounded-control bg-surface-muted px-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Buscar pessoa</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </label>

        <nav aria-label="Lista de pessoas da unidade">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {term ? "Nenhuma pessoa com essa busca." : "Esta unidade ainda não tem proprietário nem inquilino vigente."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((link) => {
                const role = UNIT_ROLE_LABELS[link.role === "owner" ? "owner" : "tenant"];
                const detail = [
                  role,
                  link.role === "owner" && link.ownership_percentage ? `${Number(link.ownership_percentage)}%` : null,
                  `desde ${formatDate(link.start_date)}`,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={link.id}>
                    <Link
                      href={personUrl(link.person, { condominium: condominiumId, unit: unitId, from: here })}
                      className="block rounded-panel px-3 py-2 outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="block truncate text-body font-medium">
                        <span className="tabular-nums">{formatCode(link.person_detail.code)}</span>
                        <span className="text-ink-faint"> · </span>
                        {link.person_detail.name}
                      </span>
                      <span className="block truncate text-caption text-ink-soft">{detail}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {!isLoading && links.length > 0 && <ShowMore shown={results.length} total={matches.length} noun="pessoa(s)" onMore={showMore} />}
      </div>
    </section>
  );
}
