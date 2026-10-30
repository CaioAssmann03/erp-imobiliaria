"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { DateField, SelectField, TextField } from "@/components/form/fields";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  getAccountsPayableListQueryKey,
  getAccountsPayableRetrieveQueryKey,
  getCurrentAccountEntriesListQueryKey,
  getCurrentAccountsListQueryKey,
  getDashboardRetrieveQueryKey,
  useAccountsPayableSettle,
} from "@/lib/api/generated";
import type { AccountPayable, PaymentMethodEnum } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { brl, todayIso } from "@/lib/format";
import { maskMoney, moneyFromApi } from "@/lib/masks";
import {
  PAYMENT_METHODS,
  settleAccountPayableSchema,
  type SettleAccountPayableFormInput,
  type SettleAccountPayableFormOutput,
} from "@/lib/schemas/account-payable";
import { toast } from "@/lib/toast";

/**
 * Baixa de uma conta a pagar em aberto. Uma despesa de condomínio gera o débito no extrato do
 * condomínio; por isso ela precisa de um modelo de lançamento (o servidor recusa sem ele).
 */
export function SettleAccountPayableDialog({ account, solid = false }: { account: AccountPayable; /** O botão da barra de ações do formulário (sólido, "Dar baixa"); sem isto é o discreto de uma linha. */ solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const settleMutation = useAccountsPayableSettle();
  const needsEntryTemplate = account.condominium !== null && !account.entry_template;

  const methods = useForm<SettleAccountPayableFormInput, unknown, SettleAccountPayableFormOutput>({
    resolver: zodResolver(settleAccountPayableSchema),
    defaultValues: {
      payment_date: todayIso(),
      amount_paid: moneyFromApi(account.amount),
      payment_method: "boleto",
    },
    mode: "onTouched",
  });
  const { handleSubmit, setError } = methods;

  const submit = (values: SettleAccountPayableFormOutput) =>
    settleMutation.mutate(
      {
        id: account.id,
        data: {
          payment_date: values.payment_date as string,
          amount_paid: values.amount_paid as string,
          payment_method: values.payment_method as PaymentMethodEnum,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAccountsPayableListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getAccountsPayableRetrieveQueryKey(account.id) });
          queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCurrentAccountsListQueryKey() });
          queryClient.invalidateQueries({ queryKey: getCurrentAccountEntriesListQueryKey() });
          toast.success(
            account.condominium ? "Conta paga. O débito foi lançado no extrato do condomínio." : "Conta paga."
          );
          setOpen(false);
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );

  return (
    <>
      <Button type="button" variant={solid ? "secondary" : "ghost"} size={solid ? "default" : "sm"} onClick={() => setOpen(true)}>
        {solid ? "Dar baixa" : "Baixar"}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Baixar conta a pagar</AlertDialogTitle>
            <AlertDialogDescription>
              {account.description} · {account.supplier_name} · {brl(account.amount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsEntryTemplate ? (
            <p className="text-body text-ink-soft">
              Esta despesa de condomínio ainda não tem modelo de lançamento, necessário para lançar o débito no extrato.{" "}
              <Link href={`/finance/accounts-payable/${account.id}`} className="text-ink underline">
                Editar a conta
              </Link>
            </p>
          ) : (
            <FormProvider {...methods}>
              <form
                noValidate
                // O diálogo fica na barra do formulário da conta (na árvore do React, não no DOM): sem isto o envio da baixa subiria e salvaria a conta junto.
                onSubmit={(event) => {
                  event.stopPropagation();
                  void handleSubmit(submit)(event);
                }}
                className="space-y-3"
                id={`settle-${account.id}`}
              >
                <DateField name="payment_date" label="Data do pagamento" required />
                <TextField
                  name="amount_paid"
                  label="Valor pago"
                  required
                  inputMode="numeric"
                  mask={(value) => maskMoney(value, 12)}
                  hint="Pode ser diferente do valor da conta (juros, desconto)."
                />
                <SelectField
                  name="payment_method"
                  label="Forma de pagamento"
                  required
                  options={PAYMENT_METHODS}
                />
              </form>
            </FormProvider>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            {!needsEntryTemplate && (
              <Button type="submit" form={`settle-${account.id}`} disabled={settleMutation.isPending}>
                {settleMutation.isPending ? "Baixando…" : "Confirmar baixa"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
