"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider, ScopeSearchCard, ScopeSearchRow } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingDocumentsList, useCondominiumsList } from "@/lib/api/generated";
import type { BillingDocumentsListKind, BillingDocumentsListStatus } from "@/lib/api/generated/models";
import { billingDocumentsUrl } from "@/lib/billing/billing-document-workspace";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { todayIso } from "@/lib/format/format";
import { cn } from "@/lib/utils";

import { BillingDocumentListItem } from "./BillingDocumentListItem";
import { useDocumentsScope } from "./use-documents-scope";

/**
 * Client Component: a coluna da esquerda dos documentos de cobrança, no padrão da lista de condomínios: o título (sem **+**: um documento nasce da emissão do mês
 * ou do boleto extra, não de um cadastro), o condomínio como escopo obrigatório (seletor; fica na URL, então o documento aberto o segue: sem ele a lista não mostra
 * nada) e, escolhido, o mês de referência ("Todos" não filtra), a busca no servidor pela unidade ou pelo pagador com o filtro discreto dentro (situação, tipo, só
 * vencidos) e os documentos, 10 de cada vez.
 */
export function BillingDocumentsList({ openDocumentId, className }: { openDocumentId: string | null; className?: string }) {
  const router = useRouter();
  const scope = useDocumentsScope();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", kind: "", overdue: "" });
  const term = useDebouncedValue(search.trim());

  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${scope.month}|${term}|${filters.status}|${filters.kind}|${filters.overdue}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const hasScope = scope.condominium !== "";
  const { data, isLoading, isPlaceholderData } = useBillingDocumentsList(
    {
      limit,
      condominium: scope.condominium,
      ...(scope.month ? { reference_month: scope.month } : {}),
      ...(term ? { query: term } : {}),
      ...(filters.status ? { status: filters.status as BillingDocumentsListStatus } : {}),
      ...(filters.kind ? { kind: filters.kind as BillingDocumentsListKind } : {}),
      ...(filters.overdue ? { is_overdue: true } : {}),
    },
    { query: { enabled: hasScope, placeholderData: keepPreviousData } }
  );
  const documents = data?.results ?? [];
  const hasFilter = Boolean(term || filters.status || filters.kind || filters.overdue);

  const setFilter = (key: keyof typeof filters) => (value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: filters.status,
      onChange: setFilter("status"),
      options: [
        { value: "issued", label: "Emitidos" },
        { value: "registered", label: "Registrados" },
        { value: "paid", label: "Pagos" },
        { value: "cancelled", label: "Cancelados" },
      ],
    },
    {
      key: "kind",
      label: "Tipo",
      value: filters.kind,
      onChange: setFilter("kind"),
      options: [
        { value: "monthly", label: "Mensais" },
        { value: "extra", label: "Extras" },
      ],
    },
    {
      key: "overdue",
      label: "Vencimento",
      value: filters.overdue,
      onChange: setFilter("overdue"),
      options: [{ value: "true", label: "Só vencidos" }],
    },
  ];

  return (
    <aside
      aria-label="Documentos de cobrança"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="px-1">
        <h2 className="text-heading">Documentos de cobrança</h2>
      </div>

      <ScopeSearchCard
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={scope.condominium}
              placeholder="Selecione o condomínio"
              onChange={(condominium) => router.push(billingDocumentsUrl({ ...scope, condominium }))}
              options={(condominiums?.results ?? []).map((item) => ({
                value: item.id,
                label: `${formatCode(item.code)} · ${item.name}`,
                title: item.name,
              }))}
            />
            {hasScope && (
              <>
                <ScopeDivider />
                <MonthSelect
                  className="w-28"
                  label="Mês de referência"
                  value={scope.month}
                  today={todayIso()}
                  allLabel="Todos"
                  onChange={(month) => router.push(billingDocumentsUrl({ ...scope, month }))}
                />
              </>
            )}
          </>
        }
      >
        {hasScope && (
          <ScopeSearchRow>
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              aria-label="Buscar documento pela unidade ou pelo pagador"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Unidade ou pagador"
              className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
            />
            <CompactFilter groups={groups} onClear={() => setFilters({ status: "", kind: "", overdue: "" })} />
          </ScopeSearchRow>
        )}
      </ScopeSearchCard>

      <nav aria-label="Lista de documentos" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {!hasScope ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha o condomínio para ver os documentos dele.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {hasFilter ? "Nenhum documento com esses filtros." : "Nenhum documento emitido neste mês. Eles aparecem quando a emissão do mês roda."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((document) => (
              <BillingDocumentListItem key={document.id} document={document} scope={scope} isOpen={document.id === openDocumentId} dimmed={Boolean(openDocumentId)} />
            ))}
          </ul>
        )}
      </nav>

      {hasScope && data && <ShowMore shown={documents.length} total={data.count} noun="documento(s)" onMore={showMore} />}
    </aside>
  );
}
