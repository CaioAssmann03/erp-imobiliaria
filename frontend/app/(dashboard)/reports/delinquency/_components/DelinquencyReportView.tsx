"use client";

import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  billingDocumentsDelinquencyPdf,
  useBillingDocumentsDelinquency,
  useCondominiumsList,
} from "@/lib/api/generated";
import { brl, formatDate, formatMonth, todayIso } from "@/lib/format";
import { daysLateLabel, delinquencyPdfName, reportMonths } from "@/lib/reports";
import { inputClass } from "@/lib/ui";

import { ReportDownloadButton } from "../../_components/ReportDownloadButton";
import { Stat } from "../../_components/Stat";

/** Client Component: os boletos vencidos e não pagos, com filtros por condomínio e mês de referência, totais e PDF. */
export function DelinquencyReportView() {
  const [condominium, setCondominium] = useState("");
  const [referenceMonth, setReferenceMonth] = useState("");
  const params = {
    ...(condominium ? { condominium } : {}),
    ...(referenceMonth ? { reference_month: referenceMonth } : {}),
  };

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: report, isLoading, isError } = useBillingDocumentsDelinquency(params);
  const months = reportMonths(todayIso(), 24);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-card bg-card p-4 shadow-card">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-caption font-medium text-ink-soft">
          Condomínio
          <select className={inputClass} value={condominium} onChange={(event) => setCondominium(event.target.value)}>
            <option value="">Todos</option>
            {(condominiums?.results ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {String(item.code).padStart(4, "0")} · {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-44 flex-col gap-1 text-caption font-medium text-ink-soft">
          Mês de referência
          <select className={inputClass} value={referenceMonth} onChange={(event) => setReferenceMonth(event.target.value)}>
            <option value="">Todos</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto">
          <ReportDownloadButton
            fileName={delinquencyPdfName(report?.as_of ?? todayIso())}
            fetchPdf={() => billingDocumentsDelinquencyPdf(params)}
            disabled={!report || report.count === 0}
          />
        </div>
      </div>

      {isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-card p-6 text-body text-ink-soft shadow-card">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Boletos em atraso" value={String(report.count)} />
            <Stat label="Valor em atraso" value={brl(report.total_amount)} tone={report.count > 0 ? "danger" : undefined} />
          </div>

          {report.count === 0 ? (
            <p className="rounded-card bg-card p-8 text-center text-body text-ink-soft shadow-card">
              Nenhum boleto em atraso até {formatDate(report.as_of)}.
            </p>
          ) : (
            <>
              {report.by_condominium.length > 1 && (
                <div className="rounded-card bg-card p-5 shadow-card">
                  <h2 className="mb-3 text-heading">Por condomínio</h2>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Condomínio</TableHead>
                        <TableHead className="text-right">Boletos</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.by_condominium.map((line) => (
                        <TableRow key={line.condominium_id}>
                          <TableCell>{line.condominium_name}</TableCell>
                          <TableCell className="text-right tabular-nums">{line.count}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{brl(line.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="rounded-card bg-card p-5 shadow-card">
                <h2 className="mb-3 text-heading">Boletos em atraso</h2>
                {report.truncated && (
                  <p className="mb-3 rounded-panel bg-warning-soft px-3 py-2 text-caption">
                    A lista mostra só os primeiros boletos; os totais consideram todos. Filtre por condomínio para ver o restante.
                  </p>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Condomínio</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="hidden md:table-cell">Pagador</TableHead>
                      <TableHead className="hidden md:table-cell">Referência</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Atraso</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.map((row) => (
                      <TableRow key={row.document_id}>
                        <TableCell>{row.condominium_name}</TableCell>
                        <TableCell>{row.unit_name}</TableCell>
                        <TableCell className="hidden md:table-cell">{row.payer_name}</TableCell>
                        <TableCell className="hidden tabular-nums text-ink-soft md:table-cell">{formatMonth(row.reference_month)}</TableCell>
                        <TableCell className="tabular-nums">{formatDate(row.due_date)}</TableCell>
                        <TableCell className="text-right tabular-nums text-danger">{daysLateLabel(row.days_overdue)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{brl(row.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
