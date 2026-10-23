import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BillingDocument } from "@/lib/api/generated/models";
import { INTEREST_CALCULATION_LABELS } from "@/lib/billing-documents";
import { brl, formatDate, formatMonth } from "@/lib/format";

import { BillingDocumentActions } from "./BillingDocumentActions";
import { BillingDocumentBoleto } from "./BillingDocumentBoleto";
import { BillingDocumentStatusBadge } from "./BillingDocumentStatusBadge";
import { DocumentItem } from "./DocumentItem";

const percent = (value: string) => `${Number(value).toLocaleString("pt-BR")}%`;

/**
 * Dados, itens e condições copiadas na emissão (somente leitura).
 * A única parte interativa é `BillingDocumentActions` (baixar o PDF e cancelar).
 */
export function BillingDocumentView({ document }: { document: BillingDocument }) {
  return (
    <div className="space-y-4">
      <FormSection title="Documento">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DocumentItem label="Condomínio">
            <Link href={`/condominiums/${document.condominium}`} className="underline">
              {document.condominium_name}
            </Link>
          </DocumentItem>
          <DocumentItem label="Unidade">
            <Link href={`/condominiums/${document.condominium}/units/${document.unit}`} className="underline">
              {document.unit_name}
            </Link>
          </DocumentItem>
          <DocumentItem label="Pagador">{document.payer_name}</DocumentItem>
          <DocumentItem label="Referência">{formatMonth(document.reference_month)}</DocumentItem>
          <DocumentItem label="Competência">{formatMonth(document.competence_month)}</DocumentItem>
          <DocumentItem label="Vencimento">{formatDate(document.due_date)}</DocumentItem>
          <DocumentItem label="Valor">
            <strong>{brl(document.amount)}</strong>
          </DocumentItem>
          <DocumentItem label="Situação">
            <BillingDocumentStatusBadge status={document.status} overdue={document.is_overdue} />
          </DocumentItem>
        </dl>
        <BillingDocumentActions document={document} />
      </FormSection>

      <BillingDocumentBoleto document={document} />

      <FormSection title="Itens">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden sm:table-cell">Sub-conta</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {document.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="hidden text-ink-soft sm:table-cell">{item.cost_center_name}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FormSection>

      <FormSection title="Condições na emissão" description="Copiadas das regras do condomínio quando o documento foi emitido.">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DocumentItem label="Desconto">
            {Number(document.discount_percentage) > 0
              ? `${percent(document.discount_percentage)} (${document.discount_days} dias antes do vencimento)`
              : "Sem desconto"}
          </DocumentItem>
          <DocumentItem label="Multa">
            {Number(document.late_fee_percentage) > 0 ? percent(document.late_fee_percentage) : "Sem multa"}
            {document.initial_late_fee_percentage && document.initial_late_fee_days
              ? ` · ${percent(document.initial_late_fee_percentage)} nos primeiros ${document.initial_late_fee_days} dias`
              : ""}
          </DocumentItem>
          <DocumentItem label="Juros ao mês">
            {Number(document.monthly_interest_percentage) > 0
              ? `${percent(document.monthly_interest_percentage)} · ${INTEREST_CALCULATION_LABELS[document.interest_calculation] ?? document.interest_calculation} · carência de ${document.interest_grace_days} dias`
              : "Sem juros"}
          </DocumentItem>
        </dl>
      </FormSection>
    </div>
  );
}
