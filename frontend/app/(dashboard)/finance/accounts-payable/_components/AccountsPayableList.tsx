"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { DUE_OPTIONS, newAccountPayableUrl } from "@/lib/finance/account-payable-workspace";
import { useAccountsPayableList } from "@/lib/api/generated";
import type { AccountsPayableListParams, AccountsPayableListStatus } from "@/lib/api/generated/models";
import { addDays, monthBounds, todayIso } from "@/lib/format/format";
import { PAYABLE_STATUSES } from "@/lib/schemas/account-payable";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

import { AccountPayableListItem } from "./AccountPayableListItem";

const HOLDER_OPTIONS = [
  { value: "condominium", label: "De condomínios" },
  { value: "company", label: "Da empresa" },
];

/** O período de vencimento escolhido no filtro, como parâmetros da API. */
function dueParams(due: string, today: string): Pick<AccountsPayableListParams, "due_date_after" | "due_date_before" | "status"> {
  switch (due) {
    case "overdue":
      return { status: "open", due_date_before: addDays(today, -1) };
    case "today":
      return { due_date_after: today, due_date_before: today };
    case "next_7_days":
      return { due_date_after: today, due_date_before: addDays(today, 7) };
    case "this_month": {
      const { from, to } = monthBounds(today);
      return { due_date_after: from, due_date_before: to };
    }
    default:
      return {};
  }
}

/**
 * Client Component: a coluna da esquerda das contas a pagar, no padrão da lista de condomínios: título com **+** de nova conta, o condomínio como
 * escopo (seletor), busca no servidor (descrição, documento ou fornecedor) com o filtro discreto dentro (`CompactFilter`, em 2 colunas: situação,
 * vencimento e despesa) e as contas por vencimento, 10 de cada vez, com a aberta marcada. Abre mostrando as contas em aberto.
 */
export function AccountsPayableList({ openAccountId, className }: { openAccountId: string | null; className?: string }) {
  const [search, setSearch] = useState("");
  const [condominium, setCondominium] = useState("");
  const [filters, setFilters] = useState({ status: "open", due: "", holder: "" });
  const term = useDebouncedValue(search.trim());
  const today = todayIso();

  const { limit, showMore } = useGrowingLimit(`${term}|${condominium}|${filters.status}|${filters.due}|${filters.holder}`);
  const { data, isLoading, isPlaceholderData } = useAccountsPayableList(
    {
      limit,
      ...(term ? { query: term } : {}),
      ...(condominium ? { condominium } : {}),
      ...(filters.status ? { status: filters.status as AccountsPayableListStatus } : {}),
      ...(filters.holder ? { is_company_expense: filters.holder === "company" } : {}),
      ...dueParams(filters.due, today),
    },
    { query: { placeholderData: keepPreviousData } }
  );
  const results = data?.results ?? [];
  const hasFilters = Boolean(term || condominium || filters.due || filters.holder || filters.status);

  const groups: CompactFilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: filters.status,
      onChange: (value) => setFilters((current) => ({ ...current, status: value })),
      options: PAYABLE_STATUSES,
    },
    {
      key: "due",
      label: "Vencimento",
      value: filters.due,
      onChange: (value) => setFilters((current) => ({ ...current, due: value })),
      options: DUE_OPTIONS,
    },
    {
      key: "holder",
      label: "Despesa",
      value: filters.holder,
      onChange: (value) => setFilters((current) => ({ ...current, holder: value })),
      options: HOLDER_OPTIONS,
    },
  ];

  return (
    <RegistryList
      label="Contas a pagar"
      title="Contas a pagar"
      actions={<RegistryCreate href={newAccountPayableUrl()} label="Nova conta a pagar" />}
      toolbar={
        <ScopeSearchCard scopes={<CondominiumScopeSelect value={condominium} allLabel="Todos os condomínios" onChange={setCondominium} />}>
          <RegistrySearch label="Buscar conta por descrição, documento ou fornecedor" placeholder="Descrição ou fornecedor" value={search} onChange={setSearch}>
            <CompactFilter groups={groups} onClear={() => setFilters({ status: "", due: "", holder: "" })} columns={2} />
          </RegistrySearch>
        </ScopeSearchCard>
      }
      navLabel="Lista de contas a pagar"
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={results.length === 0}
      emptyMessage={hasFilters ? "Nenhuma conta com esses filtros." : "Nenhuma conta a pagar cadastrada ainda."}
      footer={data && <ShowMore shown={results.length} total={data.count} noun="conta(s)" onMore={showMore} />}
      className={className}
    >
      {results.map((account) => (
        <AccountPayableListItem key={account.id} account={account} today={today} isOpen={account.id === openAccountId} dimmed={Boolean(openAccountId)} />
      ))}
    </RegistryList>
  );
}
