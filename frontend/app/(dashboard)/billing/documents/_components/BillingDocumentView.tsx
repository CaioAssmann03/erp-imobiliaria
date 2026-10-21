"use client";

import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBillingDocumentsRetrieve } from "@/lib/api/generated";
import { INTEREST_CALCULATION_LABELS } from "@/lib/billing-documents";
import { brl, formatDate, formatMonth } from "@/lib/format";

import { BillingDocumentActions } from "./BillingDocumentActions";
import { BillingDocumentStatusBadge } from "./BillingDocumentStatusBadge";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

const percent = (value: string) => `${Number(value).toLocaleString("pt-BR")}%`;

/** Página de um documento de cobrança: dados, itens e condições copiadas na emissão (somente leitura). */
export function BillingDocumentView({ documentId }: { documentId: string }) {
  const { data: document, isLoading } = useBillingDocumentsRetrieve(documentId);
  if (isLoading || !document) return <FormSkeleton sections={2} />;

  return (
    <div className="space-y-4">
      <FormSection title="Documento">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Item label="Condomínio">
            <Link href={`/condominiums/${document.condominium}`} className="underline">
              {document.condominium_name}
            </Link>
          </Item>
          <Item label="Unidade">
            <Link href={`/condominiums/${document.condominium}/units/${document.unit}`} className="underline">
              {document.unit_name}
            </Link>
          </Item>
          <Item label="Pagador">{document.payer_name}</Item>
          <Item label="Referência">{formatMonth(document.reference_month)}</Item>
          <Item label="Competência">{formatMonth(document.competence_month)}</Item>
          <Item label="Vencimento">{formatDate(document.due_date)}</Item>
          <Item label="Valor">
            <strong>{brl(document.amount)}</strong>
          </Item>
          <Item label="Situação">
            <BillingDocumentStatusBadge status={document.status} overdue={document.is_overdue} />
          </Item>
        </dl>
        <BillingDocumentActions document={document} />
      </FormSection>

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
          <Item label="Desconto">
            {Number(document.discount_percentage) > 0
              ? `${percent(document.discount_percentage)} (${document.discount_days} dias antes do vencimento)`
              : "Sem desconto"}
          </Item>
          <Item label="Multa">
            {Number(document.late_fee_percentage) > 0 ? percent(document.late_fee_percentage) : "Sem multa"}
            {document.initial_late_fee_percentage && document.initial_late_fee_days
              ? ` · ${percent(document.initial_late_fee_percentage)} nos primeiros ${document.initial_late_fee_days} dias`
              : ""}
          </Item>
          <Item label="Juros ao mês">
            {Number(document.monthly_interest_percentage) > 0
              ? `${percent(document.monthly_interest_percentage)} · ${INTEREST_CALCULATION_LABELS[document.interest_calculation] ?? document.interest_calculation} · carência de ${document.interest_grace_days} dias`
              : "Sem juros"}
          </Item>
        </dl>
      </FormSection>
    </div>
  );
}
