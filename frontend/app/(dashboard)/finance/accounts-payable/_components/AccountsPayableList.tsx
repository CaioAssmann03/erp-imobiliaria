"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CompactFilter, type CompactFilterGroup } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import { ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { DUE_OPTIONS, newAccountPayableUrl } from "@/lib/finance/account-payable-workspace";
import { useAccountsPayableList, useCondominiumsList } from "@/lib/api/generated";
import type { AccountsPayableListParams, AccountsPayableListStatus } from "@/lib/api/generated/models";
import { addDays, monthBounds, todayIso } from "@/lib/format/format";
import { PAYABLE_STATUSES } from "@/lib/schemas/account-payable";
import { cn } from "@/lib/utils";

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
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
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
    <aside
      aria-label="Contas a pagar"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Contas a pagar</h2>
        <Link
          href={newAccountPayableUrl()}
          aria-label="Nova conta a pagar"
          title="Nova conta a pagar"
          className="flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      <ScopeSearchCard
        scopes={
          <ScopeSelect
            variant="segment"
            className="flex-1"
            label="Condomínio"
            value={condominium}
            allLabel="Todos os condomínios"
            onChange={setCondominium}
            options={(condominiums?.results ?? []).map((item) => ({
              value: item.id,
              label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
              title: item.name,
            }))}
          />
        }
      >
        <ScopeSearchRow>
          <Search className="size-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar conta por descrição, documento ou fornecedor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Descrição ou fornecedor"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
          <CompactFilter groups={groups} onClear={() => setFilters({ status: "", due: "", holder: "" })} columns={2} />
        </ScopeSearchRow>
      </ScopeSearchCard>

      <nav aria-label="Lista de contas a pagar" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {hasFilters ? "Nenhuma conta com esses filtros." : "Nenhuma conta a pagar cadastrada ainda."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((account) => (
              <AccountPayableListItem key={account.id} account={account} today={today} isOpen={account.id === openAccountId} dimmed={Boolean(openAccountId)} />
            ))}
          </ul>
        )}
      </nav>

      {data && <ShowMore shown={results.length} total={data.count} noun="conta(s)" onMore={showMore} />}
    </aside>
  );
}
