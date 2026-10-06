import Link from "next/link";

import { FormSection } from "@/components/form/FormSection";
import type { AccountPayable } from "@/lib/api/generated/models";
import { brl, formatDate } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/schemas/account-payable";

import { PayableStatusBadge } from "./PayableStatusBadge";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}

/** Conta paga ou cancelada: só leitura (o servidor não aceita mais alterações). */
export function AccountPayableSummary({ account }: { account: AccountPayable }) {
  return (
    <FormSection
      title={account.description}
      description="Esta conta está fechada e não pode mais ser alterada."
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Item label="Situação">
          <PayableStatusBadge status={account.status} />
        </Item>
        <Item label="Fornecedor">{account.supplier_name}</Item>
        <Item label="Despesa">{account.condominium_name || "Despesa da empresa"}</Item>
        <Item label="Sub-conta">{account.cost_center_name || "—"}</Item>
        <Item label="Valor">{brl(account.amount)}</Item>
        <Item label="Vencimento">{formatDate(account.due_date)}</Item>
        {account.status === "paid" && account.payment_date && account.amount_paid && (
          <>
            <Item label="Pago em">{formatDate(account.payment_date)}</Item>
            <Item label="Valor pago">{brl(account.amount_paid)}</Item>
            <Item label="Forma de pagamento">{paymentMethodLabel(account.payment_method)}</Item>
          </>
        )}
      </dl>
      {account.status === "paid" && account.condominium && (
        <p className="text-body text-ink-soft">
          O débito deste pagamento está no{" "}
          <Link href={`/finance/statement?condominium=${account.condominium}`} className="text-ink underline">
            extrato do condomínio
          </Link>
          .
        </p>
      )}
    </FormSection>
  );
}
