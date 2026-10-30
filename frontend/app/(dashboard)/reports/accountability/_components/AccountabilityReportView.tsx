"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  currentAccountEntriesAccountabilityPdf,
  useCondominiumsList,
  useCurrentAccountEntriesAccountability,
} from "@/lib/api/generated";
import { brl, formatDate, todayIso } from "@/lib/format/format";
import { accountabilityPdfName, defaultAccountabilityMonth } from "@/lib/reports/reports";
import { cn } from "@/lib/utils";

import { ReportFilterBar } from "../../_components/ReportFilterBar";
import { REPORT_PAGE_SIZES, ReportPager } from "../../_components/ReportPager";

const VIEWS = [
  { key: "cost-centers", label: "Sub-contas" },
  { key: "entries", label: "Lançamentos" },
] as const;

/**
 * Client Component: o mês de um condomínio na conta corrente. No alto, o cartão do condomínio e do mês com o botão do PDF ao lado
 * (`ReportFilterBar`, como na inadimplência); abaixo, um único cartão: só o saldo final em tipo grande e, numa alternância, uma tabela por vez:
 * as sub-contas (com o total do mês na última linha: saldo anterior, créditos, débitos e saldo final) ou os lançamentos.
 */
export function AccountabilityReportView() {
  const [condominium, setCondominium] = useState("");
  const [month, setMonth] = useState(() => defaultAccountabilityMonth(todayIso()));
  const [view, setView] = useState<(typeof VIEWS)[number]["key"]>("cost-centers");
  const [costCentersPage, setCostCentersPage] = useState(1);
  const [entriesPage, setEntriesPage] = useState(1);
  const [pageSize, setPageSize] = useState(REPORT_PAGE_SIZES[0]);
  const params = { condominium, month };

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: report, isLoading, isError, isPlaceholderData } = useCurrentAccountEntriesAccountability(
    { ...params, cost_centers_page: costCentersPage, entries_page: entriesPage, page_size: pageSize },
    { query: { enabled: Boolean(condominium), placeholderData: keepPreviousData } }
  );
  // Quem muda o condomínio ou o mês volta as duas listas para a primeira página.
  const choose = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCostCentersPage(1);
    setEntriesPage(1);
  };
  // O tamanho vale para as duas listas, e mudá-lo volta as duas para a primeira página.
  const changePageSize = (size: number) => {
    setPageSize(size);
    setCostCentersPage(1);
    setEntriesPage(1);
  };
  const selected = (condominiums?.results ?? []).find((item) => item.id === condominium);
  const negative = report ? Number(report.closing_balance) < 0 : false;

  return (
    <div className="space-y-6">
      <ReportFilterBar
        fileName={accountabilityPdfName(selected?.code ?? 0, month)}
        fetchPdf={() => currentAccountEntriesAccountabilityPdf(params)}
        disabled={!report}
        scopes={
            <>
              <ScopeSelect
                variant="segment"
                className="flex-1"
                label="Condomínio"
                value={condominium}
                placeholder="Selecione o condomínio"
                onChange={choose(setCondominium)}
                options={(condominiums?.results ?? []).map((item) => ({
                  value: item.id,
                  label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
                  title: item.name,
                }))}
              />
              <ScopeDivider />
              <MonthSelect className="max-w-[45%] shrink-0" label="Mês" value={month} today={todayIso()} onChange={choose(setMonth)} />
            </>
          }
      />

      {!condominium ? (
        <p className="rounded-card bg-surface p-8 text-center text-body text-ink-soft">Escolha o condomínio para ver a prestação de contas do mês.</p>
      ) : isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-surface p-6 text-body text-ink-soft">Não foi possível carregar o relatório.</p>
      ) : (
        <div className="rounded-card bg-surface p-5 sm:p-6">
          <p className={cn("text-display tabular-nums", negative && "text-danger")} aria-label={`Saldo final: ${brl(report.closing_balance)}`}>
            {brl(report.closing_balance)}
          </p>

          <div className="mt-8 flex gap-1" role="group" aria-label="Ver">
            {VIEWS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={view === option.key}
                onClick={() => setView(option.key)}
                className={cn(
                  "h-8 rounded-control px-3 text-body outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50",
                  view === option.key ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={cn("mt-5 transition-opacity", isPlaceholderData && "opacity-60")}>
            {view === "cost-centers" ? (
              report.by_cost_center.length === 0 ? (
                <p className="px-3 py-2 text-body text-ink-soft">Nenhum movimento nem saldo neste mês.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Sub-conta</TableHead>
                      <TableHead className="hidden text-right md:table-cell">Saldo anterior</TableHead>
                      <TableHead className="hidden text-right md:table-cell">Créditos</TableHead>
                      <TableHead className="hidden text-right md:table-cell">Débitos</TableHead>
                      <TableHead className="text-right">Saldo final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.by_cost_center.map((line) => (
                      <TableRow key={line.cost_center_id}>
                        <TableCell>
                          <span className="tabular-nums text-ink-faint">{String(line.cost_center_code).padStart(4, "0")}</span> {line.cost_center_name}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-ink-soft md:table-cell">{brl(line.opening_balance)}</TableCell>
                        <TableCell className="hidden text-right tabular-nums text-ink-soft md:table-cell">{brl(line.total_credits)}</TableCell>
                        <TableCell className="hidden text-right tabular-nums text-ink-soft md:table-cell">{brl(line.total_debits)}</TableCell>
                        <TableCell className="text-right tabular-nums">{brl(line.closing_balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium hover:bg-transparent">
                      <TableCell>Total</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">{brl(report.opening_balance)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">{brl(report.total_credits)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">{brl(report.total_debits)}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(report.closing_balance)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )
            ) : (
              <>
                {report.entries.length === 0 ? (
                  <p className="px-3 py-2 text-body text-ink-soft">Nenhum lançamento neste mês.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-28">Data</TableHead>
                        <TableHead>Histórico</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="tabular-nums text-ink-soft">{formatDate(entry.entry_date)}</TableCell>
                          <TableCell>
                            {entry.description}
                            <div className="text-caption text-ink-faint">
                              {entry.cost_center_name}
                              {entry.unit_name ? ` · ${entry.unit_name}` : ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {entry.kind === "credit" ? brl(entry.amount) : <span className="text-danger">−{brl(entry.amount)}</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}

            {view === "cost-centers" ? (
              <ReportPager
                page={report.cost_center_page}
                pageCount={report.cost_center_page_count}
                pageSize={report.page_size}
                count={report.cost_center_count}
                onPage={setCostCentersPage}
                onPageSize={changePageSize}
              />
            ) : (
              <ReportPager
                page={report.entry_page}
                pageCount={report.entry_page_count}
                pageSize={report.page_size}
                count={report.entry_count}
                onPage={setEntriesPage}
                onPageSize={changePageSize}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
