"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CompactFilter } from "@/components/filters/CompactFilter";
import { ShowMore } from "@/components/data-list";
import type { FilterGroup } from "@/components/filters/FilterMenu";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider, ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingRunsList, useCondominiumsList } from "@/lib/api/generated";
import type { BillingRunsListStatus } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { billingRunsUrl } from "@/lib/billing/billing-run-workspace";
import { todayIso } from "@/lib/format/format";
import { cn } from "@/lib/utils";

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
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
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
  const plusClass = "flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors";

  return (
    <aside
      aria-label="Execuções da emissão"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Execuções da emissão</h2>
        <div className="flex items-center gap-1">
          {hasScope && <CompactFilter groups={groups} onClear={() => setStatus("")} />}
          {hasScope ? (
            <button
              type="button"
              aria-label="Emitir mês"
              title="Emitir mês"
              onClick={() => setIssuing(true)}
              className={cn(plusClass, "hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring")}
            >
              <Plus className="size-5" />
            </button>
          ) : (
            <span aria-disabled="true" title="Escolha o condomínio para emitir o mês" className={cn(plusClass, "cursor-not-allowed opacity-40")}>
              <Plus className="size-5" />
            </span>
          )}
        </div>
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
              onChange={(condominium) => router.push(billingRunsUrl({ ...scope, condominium }))}
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
                  onChange={(month) => router.push(billingRunsUrl({ ...scope, month }))}
                />
              </>
            )}
          </>
        }
      />

      <nav aria-label="Lista de execuções" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {!hasScope ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha o condomínio para ver as execuções dele.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">
            {status ? "Nenhuma execução com esse filtro." : "Nenhuma execução ainda. A emissão roda no dia configurado do condomínio; use o + para emitir agora."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {runs.map((run) => (
              <BillingRunListItem key={run.id} run={run} scope={scope} isOpen={run.id === openRunId} dimmed={Boolean(openRunId)} />
            ))}
          </ul>
        )}
      </nav>

      {hasScope && data && <ShowMore shown={runs.length} total={data.count} noun="execução(ões)" onMore={showMore} />}

      <IssueMonthDialog open={issuing} onOpenChange={setIssuing} scope={scope} />
    </aside>
  );
}
