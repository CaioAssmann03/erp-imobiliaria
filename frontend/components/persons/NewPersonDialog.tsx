"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { NewPersonFields } from "@/components/NewPersonFields";
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
import { getDashboardRetrieveQueryKey, getPersonsListQueryKey, usePersonsCreate } from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { PERSON_DEFAULTS, personSchema, personToPayload, type PersonFormInput, type PersonFormOutput } from "@/lib/schemas/person";
import { toast } from "@/lib/toast";

/** O documento da pessoa nova chega do servidor como `cpf` ou `cnpj`; no formulário é um campo só. */
const formPath = (path: string): string => {
  const name = path.split(".").filter((part) => !/^\d+$/.test(part)).pop() ?? path;
  return name === "cpf" || name === "cnpj" ? "document" : name;
};

/**
 * O "+" ao lado de um campo de pessoa (o assessor do condomínio…): cadastra a pessoa sem sair do formulário, com os mesmos dados da tela de Pessoas
 * (`NewPersonFields`). Ao salvar, devolve a pessoa criada em `onCreated` para o campo já a ter escolhida.
 */
export function NewPersonDialog({ onCreated }: { onCreated: (person: Person) => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createPerson = usePersonsCreate();

  const methods = useForm<PersonFormInput, unknown, PersonFormOutput>({
    resolver: zodResolver(personSchema),
    defaultValues: PERSON_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, setError, reset } = methods;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) reset(PERSON_DEFAULTS);
  };

  const submit = (values: PersonFormOutput) =>
    createPerson.mutate(
      { data: personToPayload(values, false) as unknown as Person, params: { person_module: CONDOMINIUMS_MODULE } },
      {
        onSuccess: async (person) => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getPersonsListQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
          ]);
          toast.success("Pessoa cadastrada.");
          onCreated(person);
          close(false);
        },
        onError: (error) => toast.error(applyServerErrors(error, setError, formPath)),
      }
    );

  return (
    <>
      <Button type="button" variant="secondary" size="icon" aria-label="Cadastrar uma pessoa nova" title="Cadastrar uma pessoa nova" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto data-[size=default]:sm:max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Nova pessoa</AlertDialogTitle>
            <AlertDialogDescription>Os mesmos dados do cadastro de Pessoas.</AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form
              noValidate
              id="new-person"
              // O diálogo fica dentro do formulário de quem o abriu (na árvore do React, não no DOM): sem isto o envio da pessoa subiria e salvaria aquele formulário junto.
              onSubmit={(event) => {
                event.stopPropagation();
                void handleSubmit(submit, () => toast.error("Corrija os campos destacados."))(event);
              }}
            >
              <NewPersonFields />
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="submit" form="new-person" disabled={createPerson.isPending}>
              {createPerson.isPending ? "Salvando…" : "Cadastrar pessoa"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
