"use client";

import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currentAccountEntriesAdministrationFeePdf, useCurrentAccountEntriesAdministrationFee } from "@/lib/api/generated";
import { brl, todayIso } from "@/lib/format/format";
import { administrationFeePdfName, defaultAccountabilityMonth, feeRuleLabel, feeStatusNote } from "@/lib/reports/reports";

import { ReportFilterBar } from "../../_components/ReportFilterBar";

/**
 * Client Component: a taxa de administração de cada condomínio no mês, pelo contrato e pelo extrato. No alto, o cartão do mês com o botão do PDF
 * (`ReportFilterBar`); abaixo, um cartão com a taxa devida no mês e a tabela por condomínio.
 */
export function AdministrationFeeReportView() {
  const [month, setMonth] = useState(() => defaultAccountabilityMonth(todayIso()));
  const params = { month };
  const { data: report, isLoading, isError } = useCurrentAccountEntriesAdministrationFee(params);
  const notCounted = report ? report.rows.length - report.count : 0;

  return (
    <div className="space-y-6">
      <ReportFilterBar
        fileName={administrationFeePdfName(month)}
        fetchPdf={() => currentAccountEntriesAdministrationFeePdf(params)}
        disabled={!report}
        scopes={<MonthSelect className="flex-1" label="Mês" value={month} today={todayIso()} onChange={setMonth} />}
      />

      {isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-surface p-6 text-body text-ink-soft">Não foi possível carregar o relatório.</p>
      ) : (
        <div className="rounded-card bg-surface p-6 sm:p-8">
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-title tabular-nums" aria-label={`Taxa devida no mês: ${brl(report.total_fee)}`}>
              {brl(report.total_fee)}
            </span>
            <span className="text-body text-ink-soft">
              taxa devida · {report.count} condomínio{report.count === 1 ? "" : "s"} cobrado{report.count === 1 ? "" : "s"}
              {notCounted > 0 && <span className="text-danger"> · {notCounted} fora da cobrança</span>}
            </span>
          </p>

          <div className="mt-5">
            {report.rows.length === 0 ? (
              <p className="px-3 py-2 text-body text-ink-soft">Nenhum condomínio ativo.</p>
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
                        <span className="tabular-nums text-ink-faint">{String(row.condominium_code).padStart(4, "0")}</span> {row.condominium_name}
                        {row.status !== "due" && <div className="text-caption text-danger">{feeStatusNote(row.status)}</div>}
                      </TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{row.status === "no_contract" ? "—" : feeRuleLabel(row)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums text-ink-soft md:table-cell">
                        {row.base_amount === null ? "—" : brl(row.base_amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.status === "due" ? brl(row.fee_due) : "—"}</TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{row.charges_iss_on_fee ? "Sim" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <p className="mt-4 text-caption text-ink-faint">
            A base da taxa variável é o extrato do mês, pela data do lançamento: os créditos (receita) ou os débitos (despesa). O ISS é só indicado:
            não é calculado aqui.
          </p>
        </div>
      )}
    </div>
  );
}
