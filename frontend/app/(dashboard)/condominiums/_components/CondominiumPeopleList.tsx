"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ShowMore } from "@/components/data-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useUnitPeopleList, useUnitsList } from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing-entry-payload";
import { formattedPersonDocument } from "@/lib/person-document";
import { personUrl, UNIT_ROLE_LABELS } from "@/lib/person-workspace";

/** Quantos vínculos (e unidades) a tela lê de uma vez: o máximo que a API entrega por página. */
const LINKS_LIMIT = 100;

interface CondominiumPerson {
  person: Person;
  /** "Proprietário · 101, 102" e "Inquilino · 205": o papel e as unidades dele. */
  roles: string[];
}

/**
 * Client Component: as pessoas de um condomínio, as que têm vínculo vigente (proprietário ou inquilino) com alguma unidade dele, na ordem do
 * código, no padrão visual das outras listas do condomínio (cartão branco, busca em pílula, linhas simples). Cada pessoa mostra o papel e as
 * unidades; abrir uma leva à ficha dela. A lista sai dos vínculos do condomínio (`?condominium=`), agrupados por pessoa aqui.
 */
export function CondominiumPeopleList({ condominiumId }: { condominiumId: string }) {
  const [search, setSearch] = useState("");
  const { data: links, isLoading } = useUnitPeopleList({ condominium: condominiumId, limit: LINKS_LIMIT });
  const { data: units } = useUnitsList({ condominium: condominiumId, limit: LINKS_LIMIT });

  const people = useMemo<CondominiumPerson[]>(() => {
    const unitName = new Map((units?.results ?? []).map((unit) => [unit.id, unit.name]));
    const today = new Date().toISOString().slice(0, 10);
    const byPerson = new Map<string, { person: Person; units: Record<"owner" | "tenant", string[]> }>();
    for (const link of links?.results ?? []) {
      if (link.end_date && link.end_date < today) continue;
      const entry = byPerson.get(link.person) ?? { person: link.person_detail, units: { owner: [], tenant: [] } };
      entry.units[link.role === "owner" ? "owner" : "tenant"].push(unitName.get(link.unit) ?? "—");
      byPerson.set(link.person, entry);
    }
    return [...byPerson.values()]
      .sort((a, b) => a.person.code - b.person.code)
      .map(({ person, units: byRole }) => ({
        person,
        roles: (["owner", "tenant"] as const)
          .filter((role) => byRole[role].length > 0)
          .map((role) => `${UNIT_ROLE_LABELS[role]} · ${byRole[role].join(", ")}`),
      }));
  }, [links, units]);

  const term = search.trim().toLowerCase();
  const matches = term
    ? people.filter(
        ({ person }) =>
          person.name.toLowerCase().includes(term) ||
          formatCode(person.code).includes(term) ||
          formattedPersonDocument(person).includes(term) ||
          (person.email ?? "").toLowerCase().includes(term)
      )
    : people;
  const { limit, showMore } = useGrowingLimit(`${term}|${condominiumId}`);
  const results = matches.slice(0, limit);

  return (
    <section aria-label="Pessoas" className="flex flex-col gap-3">
      <h2 className="px-1 text-heading">Pessoas</h2>

      <div className="flex flex-col gap-3 rounded-card bg-surface p-3 shadow-card">
        <label className="flex h-10 items-center gap-2 rounded-control bg-surface-muted px-3 text-ink-soft focus-within:ring-2 focus-within:ring-brand/50">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Buscar pessoa</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, CPF/CNPJ ou ID"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </label>

        <nav aria-label="Lista de pessoas do condomínio">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-12 rounded-panel" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-ink-soft">
              {term ? "Nenhuma pessoa com essa busca." : "Este condomínio ainda não tem pessoas vinculadas às unidades."}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map(({ person, roles }) => (
                <li key={person.id}>
                  <Link
                    href={personUrl(person.id)}
                    className="block rounded-panel px-3 py-2 outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block truncate text-body font-medium">
                      <span className="tabular-nums">{formatCode(person.code)}</span>
                      <span className="text-ink-faint"> · </span>
                      {person.name}
                    </span>
                    <span className="block truncate text-caption text-ink-soft">{roles.join("  ·  ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {!isLoading && people.length > 0 && <ShowMore shown={results.length} total={matches.length} noun="pessoa(s)" onMore={showMore} />}
        {links && links.count > LINKS_LIMIT && (
          <p className="px-1 text-center text-caption text-ink-soft">Mostrando os primeiros {LINKS_LIMIT} vínculos do condomínio.</p>
        )}
      </div>
    </section>
  );
}
