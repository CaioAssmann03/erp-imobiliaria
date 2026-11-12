"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import { ListFallback } from "@/components/data-list";
import { MonthSelect } from "@/components/dates/MonthSelect";
import { ScopeDivider } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUrlScope } from "@/hooks/use-url-scope";
import {
  billingDocumentsDelinquencyPdf,
  useBillingDocumentsDelinquency,
  useCondominiumsList,
  useUnitsList,
  useUnitsRetrieve,
} from "@/lib/api/generated";
import type { DelinquencyReport } from "@/lib/api/generated/models";
import { unitListLabel } from "@/lib/condominiums/unit-workspace";
import { brl, formatDate, formatMonth, todayIso } from "@/lib/format/format";
import { delinquencyScope, delinquencyScopeUrl } from "@/lib/navigation/url-scope";
import { daysLateLabel, delinquencyPdfName, monthsOpenLabel } from "@/lib/reports/reports";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { cn } from "@/lib/utils";

import { ReportFilterBar } from "../../_components/ReportFilterBar";
import { REPORT_PAGE_SIZES, ReportPager } from "../../_components/ReportPager";

const UNIT_SEARCH_RESULTS = 10;
const MONTHS_OF_A_UNIT = 100;

/**
 * Client Component: os boletos vencidos e não pagos, **por unidade** (spec 072). No alto, o cartão do condomínio, da unidade e do mês com o botão do PDF ao lado
 * (`ReportFilterBar`); abaixo, um cartão com o total vencido e a tabela de unidades, cada uma com o total e quantos meses estão em aberto. Os meses de uma unidade só
 * aparecem quando se pede (a seta da linha, ou filtrando a unidade). O condomínio, a unidade e o mês vêm da URL (o card do painel e a ficha abrem o relatório por ela).
 */
export function DelinquencyReportView() {
  const router = useRouter();
  const scope = useUrlScope(delinquencyScope);
  const { condominium, unit, month: referenceMonth } = scope;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(REPORT_PAGE_SIZES[0]);
  const [includeMonthsInPdf, setIncludeMonthsInPdf] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const params = {
    ...(condominium ? { condominium } : {}),
    ...(unit ? { unit } : {}),
    ...(referenceMonth ? { reference_month: referenceMonth } : {}),
  };

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const unitTerm = useDebouncedValue(unitSearch.trim());
  const { data: units } = useUnitsList(
    { condominium, limit: UNIT_SEARCH_RESULTS, ...(unitTerm ? { query: unitTerm } : {}) },
    { query: { enabled: condominium !== "" } }
  );
  const { data: chosenUnit } = useUnitsRetrieve(unit, { query: { enabled: unit !== "" } });
  const unitRows = [...(units?.results ?? [])];
  if (chosenUnit && !unitRows.some((item) => item.id === chosenUnit.id)) unitRows.unshift(chosenUnit);

  // Sem unidade filtrada o relatório vem resumido (uma linha por unidade); com ela, a unidade já abre com os seus meses.
  const { data: report, isLoading, isError, isPlaceholderData } = useBillingDocumentsDelinquency(
    { ...params, include_months: unit !== "", ...(unit ? { page } : { units_page: page }), page_size: pageSize },
    { query: { placeholderData: keepPreviousData } }
  );
  const late = (report?.count ?? 0) > 0;

  const choose = (key: "condominium" | "unit" | "month") => (value: string) => {
    setPage(1);
    // Trocar o condomínio larga a unidade (era dele).
    const next = { ...scope, [key]: value, ...(key === "condominium" ? { unit: "" } : {}) };
    router.replace(delinquencyScopeUrl("/reports/delinquency", next));
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar
        fileName={delinquencyPdfName(report?.as_of ?? todayIso())}
        fetchPdf={() => billingDocumentsDelinquencyPdf({ ...params, include_months: includeMonthsInPdf })}
        disabled={!late}
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={condominium}
              allLabel="Todos os condomínios"
              onChange={choose("condominium")}
              options={(condominiums?.results ?? []).map((item) => ({
                value: item.id,
                label: `${String(item.code).padStart(4, "0")} · ${item.name}`,
                title: item.name,
              }))}
            />
            {condominium !== "" && (
              <>
                <ScopeDivider />
                <ScopeSelect
                  variant="segment"
                  className="max-w-[28%] shrink-0"
                  label="Unidade"
                  value={unit}
                  allLabel="Todas as unidades"
                  onSearch={setUnitSearch}
                  onChange={choose("unit")}
                  options={unitRows.map((item) => ({ value: item.id, label: unitListLabel(unitTypeLabel(item.type), item.name), title: item.name }))}
                />
              </>
            )}
            <ScopeDivider />
            <MonthSelect
              className="max-w-[45%] shrink-0"
              label="Mês de referência"
              value={referenceMonth}
              allLabel="Todos os meses"
              today={todayIso()}
              onChange={choose("month")}
            />
          </>
        }
      />
      <label className="flex w-fit cursor-pointer items-center gap-2 text-caption text-ink-soft">
        <input
          type="checkbox"
          className="size-4 cursor-pointer accent-brand"
          checked={includeMonthsInPdf}
          onChange={(event) => setIncludeMonthsInPdf(event.target.checked)}
        />
        Incluir os meses em aberto no PDF
      </label>

      {isLoading ? (
        <ListFallback />
      ) : isError || !report ? (
        <p className="rounded-card bg-surface p-6 text-body text-ink-soft">Não foi possível carregar o relatório.</p>
      ) : (
        <div className="rounded-card bg-surface p-6 sm:p-8">
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className={cn("text-title tabular-nums", late && "text-danger")} aria-label={`Total vencido e não pago: ${brl(report.total_amount)}`}>
              {brl(report.total_amount)}
            </span>
            <span className="text-body text-ink-soft">
              {late
                ? `${report.count} boleto${report.count === 1 ? "" : "s"} vencido${report.count === 1 ? "" : "s"} · ${report.unit_count} unidade${report.unit_count === 1 ? "" : "s"}`
                : "Nenhum boleto em atraso."}
            </span>
          </p>

          {late && (
            <div className={cn("mt-6 transition-opacity", isPlaceholderData && "opacity-60")}>
              {unit ? <UnitMonthsTable report={report} /> : <UnitsTable report={report} reference={referenceMonth} />}

              <ReportPager
                page={unit ? report.page : report.units_page}
                pageCount={unit ? report.page_count : report.units_page_count}
                pageSize={report.page_size}
                count={unit ? report.count : report.unit_count}
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

/** Uma linha por unidade, com a seta que abre os meses dela (só então eles são pedidos à API). */
function UnitsTable({ report, reference }: { report: DelinquencyReport; reference: string }) {
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Condomínio · unidade</TableHead>
          <TableHead className="hidden md:table-cell">Pagador</TableHead>
          <TableHead className="hidden lg:table-cell">Mais antigo</TableHead>
          <TableHead className="text-right">Em aberto</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {report.by_unit.map((line) => {
          const open = openUnit === line.unit_id;
          return (
            <Fragment key={line.unit_id}>
              <TableRow>
                <TableCell>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-label={`Meses em aberto da unidade ${line.unit_name}`}
                    onClick={() => setOpenUnit(open ? null : line.unit_id)}
                    className="flex items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    <ChevronRight aria-hidden className={cn("size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-90")} />
                    <span>
                      {line.condominium_name} <span className="text-ink-faint">·</span> {line.unit_name}
                    </span>
                  </button>
                </TableCell>
                <TableCell className="hidden text-ink-soft md:table-cell">{line.payer_name}</TableCell>
                <TableCell className="hidden tabular-nums text-ink-soft lg:table-cell">
                  {formatDate(line.oldest_due_date)} <span className="text-ink-faint">· {daysLateLabel(line.days_overdue)}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-ink-soft">{monthsOpenLabel(line.count)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{brl(line.total_amount)}</TableCell>
              </TableRow>
              {open && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="bg-surface-muted/40 py-3">
                    <UnitMonths unitId={line.unit_id} reference={reference} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Os meses em aberto de uma unidade, pedidos à API só quando a linha é aberta. */
function UnitMonths({ unitId, reference }: { unitId: string; reference: string }) {
  const { data, isLoading, isError } = useBillingDocumentsDelinquency({
    unit: unitId,
    ...(reference ? { reference_month: reference } : {}),
    include_months: true,
    page_size: MONTHS_OF_A_UNIT,
    rows_order: "oldest",
  });
  if (isLoading) return <p className="text-caption text-ink-soft">Carregando os meses…</p>;
  if (isError || !data) return <p className="text-caption text-danger">Não foi possível carregar os meses.</p>;
  return <MonthsList rows={data.rows} />;
}

function MonthsList({ rows }: { rows: DelinquencyReport["rows"] }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((row) => (
        <li key={row.document_id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1.5 text-body">
          <span className="tabular-nums">{formatMonth(row.reference_month)}</span>
          <span className="tabular-nums text-ink-soft">
            venceu em {formatDate(row.due_date)} <span className="text-ink-faint">· {daysLateLabel(row.days_overdue)}</span>
          </span>
          <span className="tabular-nums">{brl(row.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Com a unidade filtrada: os meses dela de uma vez, na própria tabela (paginados como antes). */
function UnitMonthsTable({ report }: { report: DelinquencyReport }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Mês de referência</TableHead>
          <TableHead className="hidden md:table-cell">Pagador</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {report.rows.map((row) => (
          <TableRow key={row.document_id}>
            <TableCell className="tabular-nums">
              {formatMonth(row.reference_month)} <span className="text-ink-faint">·</span> {row.unit_name}
            </TableCell>
            <TableCell className="hidden text-ink-soft md:table-cell">{row.payer_name}</TableCell>
            <TableCell className="tabular-nums">
              {formatDate(row.due_date)} <span className="text-ink-faint">· {daysLateLabel(row.days_overdue)}</span>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">{brl(row.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
