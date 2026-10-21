"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { RowActions, RowLink } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { BillingPlan } from "@/lib/api/generated/models";
import { describeValidity } from "@/lib/billing-plan-payload";

/** Uma linha da lista de planos: abre o plano, edita e exclui (os itens saem junto). */
export function BillingPlanRow({ plan, onDelete }: { plan: BillingPlan; onDelete: (id: string) => void }) {
  const href = `/billing/plans/${plan.id}`;
  const itemCount = `${plan.items.length} ${plan.items.length === 1 ? "item" : "itens"}`;
  const validity = describeValidity(plan.start_month, plan.end_month);

  return (
    <TableRow>
      <TableCell>
        <RowLink href={href} sub={[plan.condominium_name, itemCount, plan.active ? null : "Inativo"].filter(Boolean).join(" · ")}>
          {plan.name}
        </RowLink>
      </TableCell>
      <TableCell className="hidden max-w-[16rem] truncate text-ink-soft md:table-cell">{plan.condominium_name}</TableCell>
      <TableCell className="hidden text-ink-soft md:table-cell">{itemCount}</TableCell>
      <TableCell className="hidden text-ink-soft md:table-cell">{validity}</TableCell>
      <TableCell className="hidden md:table-cell">
        <StatusBadge active={plan.active ?? true} />
      </TableCell>
      <TableCell>
        <RowActions>
          <LinkButton variant="ghost" size="sm" className="hidden md:inline-flex" href={href}>
            Editar
          </LinkButton>
          <ConfirmDeleteButton
            title="Excluir plano de cobrança?"
            description={`O plano "${plan.name}" e os seus ${plan.items.length} itens serão excluídos. Esta ação não pode ser desfeita.`}
            onConfirm={() => onDelete(plan.id)}
          />
        </RowActions>
      </TableCell>
    </TableRow>
  );
}
