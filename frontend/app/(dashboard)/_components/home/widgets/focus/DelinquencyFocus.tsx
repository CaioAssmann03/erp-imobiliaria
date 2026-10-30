"use client";

import Link from "next/link";

import { LinkButton } from "@/components/LinkButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBillingDocumentsDelinquency } from "@/lib/api/generated";
import { formatDate } from "@/lib/format/format";

import { SimpleBarChart } from "@/app/(dashboard)/_components/home/charts/SimpleBarChart";
import { brl } from "../format";
import { FocusSection, FocusStat } from "./parts";

const OLDEST_SHOWN = 10;

/** Client Component: o total vencido, os condomínios que mais devem num gráfico e os boletos mais atrasados. */
export function DelinquencyFocus() {
  const { data, isLoading } = useBillingDocumentsDelinquency();
  const byCondominium = [...(data?.by_condominium ?? [])].sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
  const oldest = [...(data?.rows ?? [])].sort((a, b) => b.days_overdue - a.days_overdue).slice(0, OLDEST_SHOWN);
  const late = (data?.count ?? 0) > 0;

  if (!data) return <p className="py-6 text-ink-soft">{isLoading ? "Carregando a inadimplência…" : "Não foi possível carregar a inadimplência."}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <FocusStat label="Vencido e não pago" value={brl(data.total_amount)} tone={late ? "danger" : "default"} hint="Valor de face dos boletos" />
        <FocusStat label="Boletos" value={data.count} />
        <FocusStat label="Condomínios com atraso" value={byCondominium.length} />
      </div>

      {late ? (
        <>
          <FocusSection title="Por condomínio" action={{ href: "/reports/delinquency", label: "Abrir o relatório" }}>
            <SimpleBarChart
              horizontal
              format="currency"
              data={byCondominium.slice(0, 8).map((item) => ({ label: item.condominium_name, value: Number(item.total_amount) }))}
              className="h-72 w-full"
            />
          </FocusSection>

          <FocusSection title="Mais atrasados">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condomínio · unidade</TableHead>
                  <TableHead className="hidden md:table-cell">Pagador</TableHead>
                  <TableHead>Venceu em</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oldest.map((row) => (
                  <TableRow key={row.document_id}>
                    <TableCell>
                      <Link href={`/billing/documents/${row.document_id}`} className="hover:underline">
                        {row.condominium_name} · {row.unit_name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-ink-soft md:table-cell">{row.payer_name}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatDate(row.due_date)} <span className="text-danger">({row.days_overdue} d)</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{brl(row.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FocusSection>
        </>
      ) : (
        <p className="py-6 text-ink-soft">Nenhum boleto vencido. Tudo em dia.</p>
      )}

      <LinkButton variant="secondary" href="/reports/delinquency">
        Relatório de inadimplência
      </LinkButton>
    </div>
  );
}
