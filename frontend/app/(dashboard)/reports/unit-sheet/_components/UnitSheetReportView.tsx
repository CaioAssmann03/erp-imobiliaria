"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ListFallback } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  currentAccountEntriesUnitSheetPdf,
  useCondominiumsList,
  useCurrentAccountEntriesUnitSheet,
  useUnitsList,
} from "@/lib/api/generated";
import { unitListLabel } from "@/lib/condominiums/unit-workspace";
import { brl, formatDate, formatMonth, todayIso } from "@/lib/format/format";
import { boletoNote, defaultSheetPeriod, unitSheetPdfName } from "@/lib/reports/reports";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { cn } from "@/lib/utils";

import { ReportFilterBar } from "../../_components/ReportFilterBar";

const STATUS_LABELS: Record<string, string> = { issued: "Emitido", registered: "Registrado", paid: "Pago", cancelled: "Cancelado" };
const MAX_UNITS_IN_PICKER = 100;

/** Client Component: a ficha de uma unidade (dados e pessoas, boletos, lançamentos) por período, e o PDF. */
export function UnitSheetReportView() {
  const searchParams = useSearchParams();
  const [condominium, setCondominium] = useState(searchParams.get("condominium") ?? "");
  const [unit, setUnit] = useState(searchParams.get("unit") ?? "");
  const [period, setPeriod] = useState(() => defaultSheetPeriod(todayIso()));
  const params = { unit, from_month: period.from, to_month: period.to };

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: units } = useUnitsList({ condominium, limit: MAX_UNITS_IN_PICKER }, { query: { enabled: Boolean(condominium) } });
  const { data: sheet, isLoading, isError } = useCurrentAccountEntriesUnitSheet(params, { query: { enabled: Boolean(unit) } });
  const periodIsValid = period.from <= period.to;
  const unitOptions = units?.results ?? [];
  const selectedCondominium = (condominiums?.results ?? []).find((item) => item.id === condominium);

  return (
    <div className="space-y-6">
      <ReportFilterBar
        fileName={unitSheetPdfName(sheet?.condominium_code ?? selectedCondominium?.code ?? 0, sheet?.unit_name ?? "")}
        fetchPdf={() => currentAccountEntriesUnitSheetPdf(params)}
        disabled={!sheet || !periodIsValid}
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={condominium}
              placeholder="Selecione o condomínio"
              onChange={(value) => {
                setCondominium(value);
                setUnit("");
              }}
              options={(condominiums?.results ?? []).map((item) => ({
                value: item.id,
                label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
                title: item.name,
              }))}
            />
            <ScopeDivider />
            <ScopeSelect
              variant="segment"
              className="max-w-[28%] shrink-0"
              label="Unidade"
              value={unit}
              placeholder={condominium ? "Unidade" : "—"}
              onChange={setUnit}
              options={unitOptions.map((item) => ({ value: item.id, label: unitListLabel(unitTypeLabel(item.type), item.name), title: item.name }))}
            />
            <ScopeDivider />
            <MonthSelect className="max-w-[20%] shrink-0" label="De" value={period.from} today={todayIso()} onChange={(value) => setPeriod({ ...period, from: value })} />
            <ScopeDivider />
            <MonthSelect className="max-w-[20%] shrink-0" label="Até" value={period.to} today={todayIso()} onChange={(value) => setPeriod({ ...period, to: value })} />
          </>
        }
      />
      {condominium && unitOptions.length > 0 && (units?.count ?? 0) > unitOptions.length && (
        <p className="text-caption text-ink-soft">A lista mostra as {MAX_UNITS_IN_PICKER} primeiras unidades do condomínio.</p>
      )}

      {!unit ? (
        <p className="rounded-card bg-surface p-8 text-center text-body text-ink-soft">Escolha o condomínio e a unidade para ver a ficha.</p>
      ) : !periodIsValid ? (
        <p className="rounded-card bg-surface p-6 text-body text-danger">O mês final não pode ser anterior ao inicial.</p>
      ) : isLoading ? (
        <ListFallback />
      ) : isError || !sheet ? (
        <p className="rounded-card bg-surface p-6 text-body text-ink-soft">Não foi possível carregar a ficha (o período vai até 36 meses).</p>
      ) : (
        <>
          <div className="rounded-card bg-surface p-6 sm:p-8">
            <h2 className="mb-3 text-heading">
              {String(sheet.condominium_code).padStart(4, "0")} · {sheet.condominium_name} — {sheet.block_name ? `${sheet.block_name} - ` : ""}
              {sheet.unit_name}
            </h2>
            <dl className="grid gap-x-6 gap-y-2 text-body sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Tipo" value={unitTypeLabel(sheet.unit_type)} />
              <Info
                label="Situação"
                value={[sheet.is_active ? "Ativa" : "Inativa", sheet.is_manager_unit ? "Unidade do síndico" : "", sheet.is_billing_blocked ? "Cobrança bloqueada" : ""]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Info label="Matrícula" value={sheet.registration_number || "—"} />
              <Info label="Moradores" value={String(sheet.resident_count)} />
              <Info label="Gás" value={brl(sheet.gas_value)} />
              <Info label="Água" value={brl(sheet.water_value)} />
              <Info label="Energia" value={brl(sheet.electricity_value)} />
              {sheet.fractions.map((fraction) => (
                <Info key={fraction.criterion_name} label={`Fração · ${fraction.criterion_name}`} value={Number(fraction.value).toLocaleString("pt-BR", { maximumFractionDigits: 6 })} />
              ))}
            </dl>
            <h3 className="mb-2 mt-5 text-body font-medium">Pessoas</h3>
            {sheet.people.length === 0 ? (
              <p className="text-body text-ink-soft">Nenhum proprietário nem inquilino atual.</p>
            ) : (
              <ul className="divide-y divide-line">
                {sheet.people.map((person) => (
                  <li key={`${person.role}-${person.name}-${person.start_date}`} className="flex flex-wrap justify-between gap-2 py-2 text-body">
                    <span>
                      <span className="text-ink-soft">{person.role === "owner" ? "Proprietário" : "Inquilino"}</span> · {person.name}
                      {person.ownership_percentage !== null && ` · ${Number(person.ownership_percentage)}%`}
                    </span>
                    <span className="text-ink-soft">
                      desde {formatDate(person.start_date)}
                      {person.end_date ? ` até ${formatDate(person.end_date)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-card bg-surface p-6 sm:p-8">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              <Total label="Emitido" value={brl(sheet.total_issued)} />
              <Total label="Pago" value={brl(sheet.total_paid)} />
              <Total label="Em aberto" value={brl(sheet.total_open)} />
              <Total label="Vencido" value={brl(sheet.total_overdue)} danger={Number(sheet.total_overdue) > 0} />
            </dl>
          </div>

          <div className="rounded-card bg-surface p-6 sm:p-8">
            <h2 className="mb-3 text-heading">Boletos</h2>
            {sheet.boletos_truncated && <Truncated what="boletos" />}
            {sheet.boletos.length === 0 ? (
              <p className="text-body text-ink-soft">Nenhum boleto neste período.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Referência</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheet.boletos.map((boleto) => (
                    <TableRow key={boleto.id}>
                      <TableCell className="tabular-nums">{formatMonth(boleto.reference_month)}</TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{boleto.kind === "extra" ? "Extra" : "Mensal"}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(boleto.due_date)}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(boleto.amount)}</TableCell>
                      <TableCell className={boleto.is_overdue ? "text-danger" : undefined}>
                        {boleto.is_overdue ? "Vencido" : (STATUS_LABELS[boleto.status] ?? boleto.status)}
                        {boletoNote(boleto) && <span className="text-caption text-ink-soft"> · {boletoNote(boleto)}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-card bg-surface p-6 sm:p-8">
            <h2 className="mb-3 text-heading">Lançamentos do extrato</h2>
            {sheet.entries_truncated && <Truncated what="lançamentos" />}
            {sheet.entries.length === 0 ? (
              <p className="text-body text-ink-soft">Nenhum lançamento neste período.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-28">Data</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="hidden md:table-cell">Sub-conta</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheet.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="tabular-nums text-ink-soft">{formatDate(entry.entry_date)}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="hidden text-ink-soft md:table-cell">{entry.cost_center_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{entry.kind === "credit" ? brl(entry.amount) : ""}</TableCell>
                      <TableCell className="text-right tabular-nums">{entry.kind === "debit" ? brl(entry.amount) : ""}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium hover:bg-transparent">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="hidden md:table-cell" />
                    <TableCell className="text-right tabular-nums">{brl(sheet.total_credits)}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(sheet.total_debits)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Total({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className={cn("text-title tabular-nums", danger && "text-danger")}>{value}</dd>
    </div>
  );
}

function Truncated({ what }: { what: string }) {
  return <p className="mb-3 rounded-panel bg-warning-soft px-3 py-2 text-caption">A lista mostra só os primeiros {what}; os totais consideram todos.</p>;
}
