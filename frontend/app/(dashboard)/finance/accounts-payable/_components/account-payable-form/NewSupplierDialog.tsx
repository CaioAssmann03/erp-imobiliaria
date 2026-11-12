"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { PersonSelectField, SelectField, TextField } from "@/components/form/fields";
import { FieldHint } from "@/components/form/FieldHint";
import { FieldRow } from "@/components/form/FormSection";
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
import { getPersonsListQueryKey, getSuppliersListQueryKey, usePersonsCreate, useSuppliersCreate } from "@/lib/api/generated";
import type { Person, Supplier } from "@/lib/api/generated/models";
import { NewPersonFields } from "@/components/persons/NewPersonFields";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { CONDOMINIUMS_MODULE } from "@/lib/persons/person-module";
import {
  SUPPLIER_ACCOUNT_KINDS,
  SUPPLIER_DEFAULTS,
  newPersonPayload,
  supplierSchema,
  supplierToPayload,
  type SupplierFormInput,
  type SupplierFormOutput,
} from "@/lib/schemas/supplier";
import { toast } from "@/lib/errors/toast";

/** O documento da pessoa nova chega do servidor como `cpf` ou `cnpj`; no formulário é um campo só. */
const formPath = (path: string): string => {
  const name = path.split(".").filter((part) => !/^\d+$/.test(part)).pop() ?? path;
  return name === "cpf" || name === "cnpj" ? "document" : name;
};

/**
 * O "+" ao lado do fornecedor da conta a pagar: cadastra o fornecedor sem sair do formulário. A pessoa é uma que já existe (busca) ou uma nova
 * (tipo, documento e nome); os dados de pagamento são opcionais. Ao salvar, o fornecedor já fica escolhido na conta (`onCreated`).
 */
export function NewSupplierDialog({ onCreated }: { onCreated: (supplierId: string) => void }) {
  const [open, setOpen] = useState(false);
  // A pessoa nova já criada: se o fornecedor for recusado, tentar de novo reaproveita a pessoa em vez de criar outra (o documento é único).
  const createdPerson = useRef<string | undefined>(undefined);
  const queryClient = useQueryClient();
  const createPerson = usePersonsCreate();
  const createSupplier = useSuppliersCreate();

  const methods = useForm<SupplierFormInput, unknown, SupplierFormOutput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: SUPPLIER_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, setError, setValue, reset, clearErrors } = methods;
  const newPerson = useWatch({ control: methods.control, name: "new_person" });
  const isSubmitting = createPerson.isPending || createSupplier.isPending;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      reset(SUPPLIER_DEFAULTS);
      createdPerson.current = undefined;
    }
  };

  const submit = async (values: SupplierFormOutput) => {
    try {
      let personId = values.new_person ? createdPerson.current : values.person;
      if (!personId) {
        const person = await createPerson.mutateAsync({
          data: newPersonPayload(values) as unknown as Person,
          params: { person_module: CONDOMINIUMS_MODULE },
        });
        personId = person.id;
        createdPerson.current = person.id;
        void queryClient.invalidateQueries({ queryKey: getPersonsListQueryKey() });
      }
      const supplier = await createSupplier.mutateAsync({ data: supplierToPayload(values, personId) as unknown as Supplier });
      await queryClient.invalidateQueries({ queryKey: getSuppliersListQueryKey() });
      toast.success("Fornecedor cadastrado.");
      onCreated(supplier.id);
      close(false);
    } catch (error) {
      toast.error(applyServerErrors(error, setError, formPath));
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" size="icon" aria-label="Novo fornecedor" title="Novo fornecedor" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto data-[size=default]:sm:max-w-4xl">
          {newPerson && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Voltar para a busca de pessoa"
              className="-ml-3 gap-1.5 justify-self-start text-ink-soft hover:text-ink"
              onClick={() => {
                setValue("new_person", false);
                clearErrors();
              }}
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          )}
          <AlertDialogHeader>
            <AlertDialogTitle>{newPerson ? "Nova pessoa" : "Novo fornecedor"}</AlertDialogTitle>
            <AlertDialogDescription>
              {newPerson ? "Cadastre a pessoa que será o fornecedor." : "Escolha uma pessoa já cadastrada ou cadastre uma nova."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form
              noValidate
              id="new-supplier"
              // O diálogo fica dentro do formulário da conta (na árvore do React, não no DOM): sem isto o envio do fornecedor subiria e salvaria a conta junto.
              onSubmit={(event) => {
                event.stopPropagation();
                void handleSubmit(submit, () => toast.error("Corrija os campos destacados."))(event);
              }}
              className="space-y-5"
            >
              {newPerson ? (
                <div className="space-y-3">
                  <NewPersonFields />
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <PersonSelectField name="person" label="Pessoa" required className="min-w-0 flex-1" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label="Cadastrar uma pessoa nova"
                    title="Cadastrar uma pessoa nova"
                    onClick={() => {
                      setValue("person", "");
                      setValue("new_person", true);
                      clearErrors();
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}

              <fieldset className="space-y-4">
                <legend className="mb-2">
                  <span className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-soft">
                    Dados de pagamento
                    <FieldHint label="Dados de pagamento">Opcionais. Banco, agência e conta vêm juntos; a chave Pix pode vir sozinha.</FieldHint>
                  </span>
                </legend>
                <FieldRow columns={3}>
                  <TextField name="bank_code" label="Banco" inputMode="numeric" maxLength={3} placeholder="Ex.: 001" autoComplete="off" />
                  <TextField name="branch" label="Agência" maxLength={10} autoComplete="off" />
                  <TextField name="account_number" label="Conta" maxLength={20} autoComplete="off" />
                </FieldRow>
                <FieldRow>
                  <SelectField name="account_kind" label="Tipo de conta" placeholder="Selecione" options={SUPPLIER_ACCOUNT_KINDS} />
                  <TextField name="pix_key" label="Chave Pix" maxLength={140} autoComplete="off" />
                </FieldRow>
              </fieldset>
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="submit" form="new-supplier" disabled={isSubmitting}>
              {isSubmitting ? "Salvando…" : "Cadastrar fornecedor"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
