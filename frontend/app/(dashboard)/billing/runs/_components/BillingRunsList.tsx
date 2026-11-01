"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider, ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingRunsList } from "@/lib/api/generated";
import type { BillingRunsListStatus } from "@/lib/api/generated/models";
import { billingRunsUrl } from "@/lib/billing/billing-run-workspace";
import { todayIso } from "@/lib/format/format";
import { RegistryCreate, RegistryList } from "@/components/layout/RegistryList";
import { CondominiumScopeSelect } from "@/components/filters/CondominiumScopeSelect";

import { BillingRunListItem } from "./BillingRunListItem";
import { IssueMonthDialog } from "./IssueMonthDialog";
import { useRunsScope } from "./use-runs-scope";

/**
 * Client Component: a coluna da esquerda das execuções da emissão, no padrão da lista de condomínios: título com o filtro discreto da situação e o **+** (emitir o mês:
 * abre o diálogo já com o condomínio e o mês da lista), o condomínio como escopo obrigatório (seletor; fica na URL, então a execução aberta o segue: sem ele a lista
 * não mostra nada) e, escolhido, o mês de referência ("Todos" não filtra) e as execuções, da mais recente à mais antiga, 10 de cada vez, com a aberta marcada.
 */
export function BillingRunsList({ openRunId, className }: { openRunId: string | null; className?: string }) {
  const router = useRouter();
  const scope = useRunsScope();
  const [status, setStatus] = useState("");
  const [issuing, setIssuing] = useState(false);

  const hasScope = scope.condominium !== "";
  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${scope.month}|${status}`);
  const { data, isLoading, isPlaceholderData } = useBillingRunsList(
    {
      limit,
      condominium: scope.condominium,
      ...(scope.month ? { reference_month: scope.month } : {}),
      ...(status ? { status: status as BillingRunsListStatus } : {}),
    },
    { query: { enabled: hasScope, placeholderData: keepPreviousData } }
  );
  const runs = data?.results ?? [];

  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Situação",
      value: status,
      onChange: setStatus,
      options: [
        { value: "succeeded", label: "Concluídas" },
        { value: "partial", label: "Parciais" },
        { value: "failed", label: "Com falha" },
        { value: "running", label: "Em andamento" },
      ],
    },
  ];

  return (
    <RegistryList
      label="Execuções da emissão"
      title="Execuções da emissão"
      actions={
        <>
          {hasScope && <CompactFilter groups={groups} onClear={() => setStatus("")} />}
          <RegistryCreate label="Emitir mês" onClick={() => setIssuing(true)} disabledHint={hasScope ? undefined : "Escolha o condomínio para emitir o mês"} />
        </>
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <>
              <CondominiumScopeSelect value={scope.condominium} onChange={(condominium) => router.push(billingRunsUrl({ ...scope, condominium }))} />
              {hasScope && (
                <>
                  <ScopeDivider />
                  <MonthSelect
                    className="w-28"
                    label="Mês de referência"
                    value={scope.month}
                    today={todayIso()}
                    allLabel="Todos"
                    onChange={(month) => router.push(billingRunsUrl({ ...scope, month }))}
                  />
                </>
              )}
            </>
          }
        />
      }
      navLabel="Lista de execuções"
      blocked={hasScope ? null : "Escolha o condomínio para ver as execuções dele."}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      isEmpty={runs.length === 0}
      emptyMessage={status ? "Nenhuma execução com esse filtro." : "Nenhuma execução ainda. A emissão roda no dia configurado do condomínio; use o + para emitir agora."}
      footer={
        <>
          {hasScope && data && <ShowMore shown={runs.length} total={data.count} noun="execução(ões)" onMore={showMore} />}
          <IssueMonthDialog open={issuing} onOpenChange={setIssuing} scope={scope} />
        </>
      }
      className={className}
    >
      {runs.map((run) => (
        <BillingRunListItem key={run.id} run={run} scope={scope} isOpen={run.id === openRunId} dimmed={Boolean(openRunId)} />
      ))}
    </RegistryList>
  );
}
