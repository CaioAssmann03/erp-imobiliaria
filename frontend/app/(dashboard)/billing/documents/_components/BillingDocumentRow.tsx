"use client";

import { RowLink } from "@/components/data-list";
import { TableCell, TableRow } from "@/components/ui/table";
import type { BillingDocument } from "@/lib/api/generated/models";
import { brl, formatDate, formatMonth } from "@/lib/format";
import { documentStatusLabel } from "@/lib/billing-documents";

import { BillingDocumentStatusBadge } from "./BillingDocumentStatusBadge";

/** Uma linha da lista de documentos: abre o documento (a página dele tem os itens e as ações). */
export function BillingDocumentRow({ document }: { document: BillingDocument }) {
  const href = `/billing/documents/${document.id}`;
  const mobileSub = [
    document.condominium_name,
    `${formatMonth(document.reference_month)} · ${brl(document.amount)}`,
    documentStatusLabel(document.status, document.is_overdue),
  ].join(" · ");

  return (
    <TableRow>
      <TableCell>
        <RowLink href={href} sub={mobileSub}>
          {document.unit_name}
        </RowLink>
      </TableCell>
      <TableCell className="hidden max-w-[14rem] truncate text-ink-soft md:table-cell">{document.condominium_name}</TableCell>
      <TableCell className="hidden max-w-[14rem] truncate md:table-cell">{document.payer_name}</TableCell>
      <TableCell className="hidden tabular-nums md:table-cell">{formatMonth(document.reference_month)}</TableCell>
      <TableCell className="hidden tabular-nums md:table-cell">{formatDate(document.due_date)}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{brl(document.amount)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <BillingDocumentStatusBadge status={document.status} overdue={document.is_overdue} />
      </TableCell>
    </TableRow>
  );
}
