import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BillingDocument } from "@/lib/api/generated/models";
import { INTEREST_CALCULATION_LABELS } from "@/lib/billing/billing-documents";
import { brl, formatDate, formatMonth } from "@/lib/format/format";

import { BillingDocumentActions } from "./BillingDocumentActions";
import { BillingDocumentBoleto } from "./BillingDocumentBoleto";
import { BillingDocumentStatusBadge } from "@/app/(dashboard)/billing/documents/_components/BillingDocumentStatusBadge";
import { DocumentItem } from "./DocumentItem";

const percent = (value: string) => `${Number(value).toLocaleString("pt-BR")}%`;

/**
 * O resumo, o boleto no gateway, os itens e as condições copiadas na emissão (somente leitura). O alto do resumo é o que se procura primeiro: o valor, o
 * vencimento e a situação, com as ações logo abaixo; quem é o documento (condomínio, unidade, pagador…) fica embaixo, em segundo plano. A única parte interativa é
 * `BillingDocumentActions` (baixar o PDF e cancelar). O título da página (`BillingDocumentHeader`) já diz a unidade, o pagador, a competência e se é extra: o resumo
 * não os repete (a referência só aparece quando difere da competência).
 */
export function BillingDocumentView({ document }: { document: BillingDocument }) {
  return (
    <div className="space-y-4">
      <div id="resumo" className="scroll-mt-20">
        <FormSection>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DocumentItem label="Valor">
              <strong className="text-title tabular-nums">{brl(document.amount)}</strong>
            </DocumentItem>
            <DocumentItem label="Vencimento">{formatDate(document.due_date)}</DocumentItem>
            <DocumentItem label="Situação">
              <BillingDocumentStatusBadge status={document.status} overdue={document.is_overdue} />
            </DocumentItem>
          </dl>
          <BillingDocumentActions document={document} />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
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
            {document.reference_month !== document.competence_month && (
              <DocumentItem label="Referência">{formatMonth(document.reference_month)}</DocumentItem>
            )}
          </dl>
        </FormSection>
      </div>

      <div id="boleto" className="scroll-mt-20">
        <BillingDocumentBoleto document={document} />
      </div>

      <div id="itens" className="scroll-mt-20">
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
      </div>

      <div id="condicoes" className="scroll-mt-20">
        <FormSection title="Condições na emissão" hint="Copiadas das regras do condomínio quando o documento foi emitido.">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
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
    </div>
  );
}
