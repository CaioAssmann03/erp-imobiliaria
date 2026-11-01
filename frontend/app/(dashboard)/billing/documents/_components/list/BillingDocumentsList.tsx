"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider, ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingDocumentsList } from "@/lib/api/generated";
import type { BillingDocumentsListKind, BillingDocumentsListStatus } from "@/lib/api/generated/models";
import { billingDocumentsUrl } from "@/lib/billing/billing-document-workspace";
import { todayIso } from "@/lib/format/format";
import { RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";
import { RegistrySearch } from "@/components/filters/RegistrySearch";

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
    <RegistryList
      label="Documentos de cobrança"
      title="Documentos de cobrança"
      toolbar={
        <ScopeSearchCard
          scopes={
            <>
              <CondominiumScopeSelect value={scope.condominium} onChange={(condominium) => router.push(billingDocumentsUrl({ ...scope, condominium }))} />
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
            <RegistrySearch label="Buscar documento pela unidade ou pelo pagador" placeholder="Unidade ou pagador" value={search} onChange={setSearch}>
              <CompactFilter groups={groups} onClear={() => setFilters({ status: "", kind: "", overdue: "" })} />
            </RegistrySearch>
          )}
        </ScopeSearchCard>
      }
      navLabel="Lista de documentos"
      blocked={hasScope ? null : "Escolha o condomínio para ver os documentos dele."}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={documents.length === 0}
      emptyMessage={hasFilter ? "Nenhum documento com esses filtros." : "Nenhum documento emitido neste mês. Eles aparecem quando a emissão do mês roda."}
      footer={hasScope && data && <ShowMore shown={documents.length} total={data.count} noun="documento(s)" onMore={showMore} />}
      className={className}
    >
      {documents.map((document) => (
        <BillingDocumentListItem key={document.id} document={document} scope={scope} isOpen={document.id === openDocumentId} dimmed={Boolean(openDocumentId)} />
      ))}
    </RegistryList>
  );
}
