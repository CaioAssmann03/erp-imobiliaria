"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { RowActions, RowLink } from "@/components/data-list";
import { TableCell, TableRow } from "@/components/ui/table";
import type { AccountPayable } from "@/lib/api/generated/models";
import { brl, formatDate } from "@/lib/format";

import { PayableStatusBadge } from "./PayableStatusBadge";
import { SettleAccountPayableDialog } from "./SettleAccountPayableDialog";

interface AccountPayableRowProps {
  account: AccountPayable;
  /** Hoje (AAAA-MM-DD): uma conta aberta com vencimento anterior está vencida. */
  today: string;
  onCancel: (id: string) => void;
}

export function AccountPayableRow({ account, today, onCancel }: AccountPayableRowProps) {
  const href = `/finance/accounts-payable/${account.id}`;
  const isOpen = account.status === "open";
  const overdue = isOpen && account.due_date < today;
  const condominium = account.condominium_name || "Despesa da empresa";

  return (
    <TableRow>
      <TableCell>
        <RowLink href={href} sub={[account.supplier_name, condominium].join(" · ")} subAlways compact>
          {account.description}
        </RowLink>
      </TableCell>
      <TableCell className="hidden text-ink-soft tabular-nums md:table-cell">{formatDate(account.due_date)}</TableCell>
      <TableCell className="hidden tabular-nums md:table-cell">{brl(account.amount_paid ?? account.amount)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <PayableStatusBadge status={account.status} overdue={overdue} />
      </TableCell>
      <TableCell>
        {/* Só baixar e cancelar: abrir (e editar) é o link da descrição, então a coluna de ações fica estreita. */}
        <RowActions>
          {isOpen && (
            <>
              <SettleAccountPayableDialog account={account} />
              <ConfirmDeleteButton
                label="Cancelar"
                title="Cancelar conta a pagar?"
                description={`A conta "${account.description}" será cancelada e não poderá mais ser alterada.`}
                onConfirm={() => onCancel(account.id)}
              />
            </>
          )}
        </RowActions>
      </TableCell>
    </TableRow>
  );
}
