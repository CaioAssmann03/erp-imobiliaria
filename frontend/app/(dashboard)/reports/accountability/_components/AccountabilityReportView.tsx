"use client";

import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  currentAccountEntriesAccountabilityPdf,
  useCondominiumsList,
  useCurrentAccountEntriesAccountability,
} from "@/lib/api/generated";
import { brl, formatDate, formatMonth, todayIso } from "@/lib/format";
import { accountabilityPdfName, defaultAccountabilityMonth, reportMonths } from "@/lib/reports";
import { inputClass } from "@/lib/ui";

import { ReportDownloadButton } from "../../_components/ReportDownloadButton";
import { Stat } from "../../_components/Stat";

/** Client Component: o mês de um condomínio na conta corrente, por sub-conta e com os lançamentos, e o PDF. */
export function AccountabilityReportView() {
  const [condominium, setCondominium] = useState("");
  const [month, setMonth] = useState(() => defaultAccountabilityMonth(todayIso()));
  const params = { condominium, month };

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: report, isLoading, isError } = useCurrentAccountEntriesAccountability(params, {
    query: { enabled: Boolean(condominium) },
  });
  const months = reportMonths(todayIso(), 24);
  const selected = (condominiums?.results ?? []).find((item) => item.id === condominium);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-card bg-card p-4 shadow-card">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-caption font-medium text-ink-soft">
          Condomínio
          <select className={inputClass} value={condominium} onChange={(event) => setCondominium(event.target.value)}>
            <option value="">Selecione</option>
            {(condominiums?.results ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {String(item.code).padStart(4, "0")} · {item.name}
              </option>
            ))}
          </select>
        </label>
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
            fileName={accountabilityPdfName(selected?.code ?? 0, month)}
            fetchPdf={() => currentAccountEntriesAccountabilityPdf(params)}
            disabled={!report}
          />
        </div>
      </div>

      {!condominium ? (
        <p className="rounded-card bg-card p-8 text-center text-body text-ink-soft shadow-card">
          Escolha o condomínio para ver a prestação de contas do mês.
        </p>
      ) : isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-card p-6 text-body text-ink-soft shadow-card">Não foi possível carregar o relatório.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Saldo anterior" value={brl(report.opening_balance)} />
            <Stat label="Créditos" value={brl(report.total_credits)} />
            <Stat label="Débitos" value={brl(report.total_debits)} />
            <Stat label="Saldo final" value={brl(report.closing_balance)} tone={Number(report.closing_balance) < 0 ? "danger" : undefined} />
          </div>

          <div className="rounded-card bg-card p-5 shadow-card">
            <h2 className="mb-3 text-heading">Por sub-conta</h2>
            {report.by_cost_center.length === 0 ? (
              <p className="text-body text-ink-soft">Nenhum movimento nem saldo neste mês.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Sub-conta</TableHead>
                    <TableHead className="text-right">Saldo anterior</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                    <TableHead className="text-right">Débitos</TableHead>
                    <TableHead className="text-right">Saldo final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.by_cost_center.map((line) => (
                    <TableRow key={line.cost_center_id}>
                      <TableCell>
                        <span className="tabular-nums text-ink-soft">{String(line.cost_center_code).padStart(4, "0")}</span>
                        {" · "}
                        {line.cost_center_name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{brl(line.opening_balance)}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(line.total_credits)}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(line.total_debits)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{brl(line.closing_balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-card bg-card p-5 shadow-card">
            <h2 className="mb-3 text-heading">Lançamentos do mês</h2>
            {report.truncated && (
              <p className="mb-3 rounded-panel bg-warning-soft px-3 py-2 text-caption">
                A lista mostra só os primeiros lançamentos; os totais consideram todos.
              </p>
            )}
            {report.entries.length === 0 ? (
              <p className="text-body text-ink-soft">Nenhum lançamento neste mês.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="hidden md:table-cell">Sub-conta</TableHead>
                    <TableHead className="hidden md:table-cell">Unidade</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="tabular-nums text-ink-soft">{formatDate(entry.entry_date)}</TableCell>
                      <TableCell>
                        {entry.description}
                        <div className="text-caption text-ink-soft">{entry.entry_template_name}</div>
                      </TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{entry.cost_center_name}</TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{entry.unit_name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{entry.kind === "credit" ? brl(entry.amount) : ""}</TableCell>
                      <TableCell className="text-right tabular-nums">{entry.kind === "debit" ? brl(entry.amount) : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
