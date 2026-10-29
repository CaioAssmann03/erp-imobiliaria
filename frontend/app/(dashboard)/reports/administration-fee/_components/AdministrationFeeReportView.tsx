"use client";

import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currentAccountEntriesAdministrationFeePdf, useCurrentAccountEntriesAdministrationFee } from "@/lib/api/generated";
import { brl, formatMonth, todayIso } from "@/lib/format";
import { administrationFeePdfName, defaultAccountabilityMonth, feeRuleLabel, feeStatusNote, reportMonths } from "@/lib/reports";
import { inputClass } from "@/lib/ui";

import { ReportDownloadButton } from "../../_components/ReportDownloadButton";
import { Stat } from "../../_components/Stat";

/** Client Component: a taxa de administração de cada condomínio no mês, pelo contrato e pelo extrato, e o PDF. */
export function AdministrationFeeReportView() {
  const [month, setMonth] = useState(() => defaultAccountabilityMonth(todayIso()));
  const params = { month };
  const { data: report, isLoading, isError } = useCurrentAccountEntriesAdministrationFee(params);
  const months = reportMonths(todayIso(), 24);
  const notCounted = report ? report.rows.length - report.count : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-card bg-card p-4 shadow-card">
        <label className="flex min-w-44 flex-col gap-1 text-caption font-medium text-ink-soft">
          Mês
          <select className={inputClass} value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((item) => (
              <option key={item} value={item}>
                {formatMonth(item)}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto">
          <ReportDownloadButton
            fileName={administrationFeePdfName(month)}
            fetchPdf={() => currentAccountEntriesAdministrationFeePdf(params)}
            disabled={!report}
          />
        </div>
      </div>

      {isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-card p-6 text-body text-ink-soft shadow-card">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Taxa devida no mês" value={brl(report.total_fee)} />
            <Stat label="Condomínios cobrados" value={String(report.count)} />
            <Stat label="Fora da cobrança" value={String(notCounted)} tone={notCounted > 0 ? "danger" : undefined} />
          </div>

          <div className="rounded-card bg-card p-5 shadow-card">
            <h2 className="mb-3 text-heading">Por condomínio</h2>
            {report.rows.length === 0 ? (
              <p className="text-body text-ink-soft">Nenhum condomínio ativo.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Condomínio</TableHead>
                    <TableHead className="hidden md:table-cell">Regra do contrato</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Base do mês</TableHead>
                    <TableHead className="text-right">Taxa devida</TableHead>
                    <TableHead className="hidden md:table-cell">ISS na taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.condominium_id}>
                      <TableCell>
                        <span className="tabular-nums text-ink-soft">{String(row.condominium_code).padStart(4, "0")}</span>
                        {" · "}
                        {row.condominium_name}
                        {row.status !== "due" && <div className="text-caption text-danger">{feeStatusNote(row.status)}</div>}
                      </TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{row.status === "no_contract" ? "—" : feeRuleLabel(row)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {row.base_amount === null ? "—" : brl(row.base_amount)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{row.status === "due" ? brl(row.fee_due) : "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{row.charges_iss_on_fee ? "Sim" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="mt-3 text-caption text-ink-soft">
              A base da taxa variável é o extrato do mês, pela data do lançamento: os créditos (receita) ou os débitos (despesa). O ISS é só indicado:
              não é calculado aqui.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
