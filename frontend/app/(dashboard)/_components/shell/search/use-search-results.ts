"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearchRetrieve } from "@/lib/api/generated";
import type { Search } from "@/lib/api/generated/models";
import { brl, formatDate, formatMonth } from "@/lib/format";
import { documentStatusLabel } from "@/lib/billing-documents";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { payableStatusLabel } from "@/lib/schemas/account-payable";
import { isSearchable, searchStatic } from "@/lib/search-index";

import type { SearchResultItem } from "./types";

const DEBOUNCE_MS = 250;

function withId(code: number, ...details: (string | null | undefined)[]) {
  return [`ID ${code}`, ...details].filter(Boolean).join(" · ");
}

function apiResults(data: Search): SearchResultItem[] {
  return [
    ...data.persons.map((person) => ({
      key: `p${person.id}`,
      group: "Pessoas",
      title: person.name,
      subtitle: withId(person.code, person.document),
      href: `/persons/${person.id}`,
    })),
    ...data.condominiums.map((condominium) => ({
      key: `c${condominium.id}`,
      group: "Condomínios",
      title: condominium.name,
      subtitle: withId(
        condominium.code,
        condominium.city ? `${condominium.city}/${condominium.state}` : condominium.cnpj
      ),
      href: `/condominiums/${condominium.id}`,
    })),
    ...data.units.map((unit) => ({
      key: `u${unit.id}`,
      group: "Unidades",
      title: `Unidade ${unit.name}`,
      subtitle: unit.condominium_name,
      href: `/condominiums/${unit.condominium}/units/${unit.id}`,
    })),
    ...data.blocks.map((block) => ({
      key: `b${block.id}`,
      group: "Blocos",
      title: block.name,
      subtitle: block.condominium_name,
      href: `/condominiums/blocks/${block.id}`,
    })),
    ...data.cost_centers.map((costCenter) => ({
      key: `cc${costCenter.id}`,
      group: "Sub-contas",
      title: costCenter.name,
      subtitle: costCenter.condominium_name,
      href: `/condominiums/cost-centers/${costCenter.id}`,
    })),
    ...data.accounts_payable.map((account) => ({
      key: `ap${account.id}`,
      group: "Contas a pagar",
      title: account.description,
      subtitle: [account.supplier_name, brl(account.amount), `vence ${formatDate(account.due_date)}`, payableStatusLabel(account.status)].join(" · "),
      href: `/finance/accounts-payable/${account.id}`,
    })),
    ...data.billing_plans.map((plan) => ({
      key: `bp${plan.id}`,
      group: "Planos de cobrança",
      title: plan.name,
      subtitle: plan.condominium_name,
      href: `/billing/plans/${plan.id}`,
    })),
    ...data.billing_documents.map((document) => ({
      key: `bd${document.id}`,
      group: "Documentos de cobrança",
      title: `${document.condominium_name} · unidade ${document.unit_name}`,
      subtitle: [document.payer_name, formatMonth(document.reference_month), brl(document.amount), documentStatusLabel(document.status)].join(" · "),
      href: `/billing/documents/${document.id}`,
    })),
  ];
}

/**
 * Resultados da busca global: cadastros da API (TanStack Query, com debounce e cache por termo)
 * mais páginas e gráficos do painel, filtrados no navegador sem esperar o debounce.
 */
export function useSearchResults(query: string) {
  const trimmed = query.trim();
  const term = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = isSearchable(term);

  const { data, isFetching } = useSearchRetrieve(
    { q: term, module: CONDOMINIUMS_MODULE },
    { query: { enabled, placeholderData: keepPreviousData, staleTime: 30_000 } }
  );

  const items = useMemo<SearchResultItem[]>(() => {
    const fromApi = enabled && data ? apiResults(data) : [];
    const pages = searchStatic(query).map((item) => ({
      key: item.href,
      group: "Páginas e gráficos",
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
    }));
    return [...fromApi, ...pages];
  }, [data, enabled, query]);

  return {
    items,
    searchable: isSearchable(query),
    waiting: isSearchable(query) && (isFetching || trimmed !== term),
  };
}
