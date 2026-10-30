"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  billingDocumentsDelinquencyPdf,
  useBillingDocumentsDelinquency,
  useCondominiumsList,
} from "@/lib/api/generated";
import { brl, formatDate, formatMonth, todayIso } from "@/lib/format/format";
import { daysLateLabel, delinquencyPdfName } from "@/lib/reports/reports";
import { cn } from "@/lib/utils";

import { ReportFilterBar } from "../../_components/ReportFilterBar";
import { REPORT_PAGE_SIZES, ReportPager } from "../../_components/ReportPager";
import { DelinquencyShareChart } from "./DelinquencyShareChart";

/**
 * Client Component: os boletos vencidos e não pagos. No alto, o cartão do condomínio e do mês com o botão do PDF ao lado (`ReportFilterBar`); abaixo, um único
 * cartão: o total em vermelho, a rosca com a participação dos condomínios (tamanho fixo; clicar filtra) e os boletos em atraso,
 * 10 por página (ou mais, à escolha).
 */
export function DelinquencyReportView() {
  const [condominium, setCondominium] = useState("");
  const [referenceMonth, setReferenceMonth] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(REPORT_PAGE_SIZES[0]);
  const params = {
    ...(condominium ? { condominium } : {}),
    ...(referenceMonth ? { reference_month: referenceMonth } : {}),
  };

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: report, isLoading, isError, isPlaceholderData } = useBillingDocumentsDelinquency(
    { ...params, page, page_size: pageSize },
    { query: { placeholderData: keepPreviousData } }
  );
  const late = (report?.count ?? 0) > 0;
  const total = Number(report?.total_amount ?? 0);
  const canBreakDown = (report?.by_condominium.length ?? 0) > 1;

  const choose = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar
        fileName={delinquencyPdfName(report?.as_of ?? todayIso())}
        fetchPdf={() => billingDocumentsDelinquencyPdf(params)}
        disabled={!late}
        scopes={
            <>
              <ScopeSelect
                variant="segment"
                className="flex-1"
                label="Condomínio"
                value={condominium}
                allLabel="Todos os condomínios"
                onChange={choose(setCondominium)}
                options={(condominiums?.results ?? []).map((item) => ({
                  value: item.id,
                  label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
                  title: item.name,
                }))}
              />
              <ScopeDivider />
              <MonthSelect
                className="max-w-[45%] shrink-0"
                label="Mês de referência"
                value={referenceMonth}
                allLabel="Todos os meses"
                today={todayIso()}
                onChange={choose(setReferenceMonth)}
              />
            </>
          }
      />

      {isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-surface p-6 text-body text-ink-soft">Não foi possível carregar o relatório.</p>
      ) : (
        <div className="rounded-card bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
            <div>
              <p className={cn("text-display tabular-nums", late && "text-danger")} aria-label={`Total vencido e não pago: ${brl(report.total_amount)}`}>
                {brl(report.total_amount)}
              </p>
              {!late && <p className="mt-1 text-body text-ink-soft">Nenhum boleto em atraso.</p>}
            </div>

            {late && canBreakDown && (
              <DelinquencyShareChart
                lines={report.by_condominium}
                total={total}
                selected={condominium}
                onSelect={choose(setCondominium)}
              />
            )}
          </div>

          {late && (
            <div className={cn("mt-6 transition-opacity", isPlaceholderData && "opacity-60")}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Condomínio · unidade</TableHead>
                    <TableHead className="hidden md:table-cell">Pagador</TableHead>
                    <TableHead className="hidden lg:table-cell">Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.document_id}>
                      <TableCell>
                        {row.condominium_name} <span className="text-ink-faint">·</span> {row.unit_name}
                      </TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{row.payer_name}</TableCell>
                      <TableCell className="hidden tabular-nums text-ink-soft lg:table-cell">{formatMonth(row.reference_month)}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatDate(row.due_date)} <span className="text-ink-faint">· {daysLateLabel(row.days_overdue)}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{brl(row.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <ReportPager
                page={report.page}
                pageCount={report.page_count}
                pageSize={report.page_size}
                count={report.count}
                onPage={setPage}
                onPageSize={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
