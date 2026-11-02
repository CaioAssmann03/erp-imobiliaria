"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { TextField } from "@/components/form/fields";
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
import { getBlocksListQueryKey, useBlocksCreate, useCondominiumsRetrieve } from "@/lib/api/generated";
import type { Block } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";
import { formatCode } from "@/lib/format/format";
import { BLOCK_DEFAULTS, blockSchema, blockToPayload, type BlockFormInput, type BlockFormOutput } from "@/lib/schemas/block";

/**
 * O "+" ao lado de um campo de bloco (o da unidade): cadastra um bloco sem sair do formulário. O bloco é sempre do `condominiumId` (por isso ele vem
 * preenchido e não se troca) e só tem o nome. Ao salvar, devolve o bloco criado em
 * `onCreated` para o campo já o ter escolhido.
 */
export function NewBlockDialog({ condominiumId, onCreated }: { condominiumId: string; onCreated: (block: Block) => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createBlock = useBlocksCreate();
  const { data: condominium } = useCondominiumsRetrieve(condominiumId, { query: { enabled: open } });

  const defaults: BlockFormInput = { ...BLOCK_DEFAULTS, condominium: condominiumId };
  const methods = useForm<BlockFormInput, unknown, BlockFormOutput>({
    resolver: zodResolver(blockSchema),
    defaultValues: defaults,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) reset(defaults);
  };

  const submit = (values: BlockFormOutput) =>
    createBlock.mutate(
      { data: blockToPayload(values, false) as unknown as Block },
      {
        onSuccess: async (block) => {
          await queryClient.invalidateQueries({ queryKey: getBlocksListQueryKey() });
          toast.success("Bloco cadastrado.");
          onCreated(block);
          close(false);
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );

  return (
    <>
      <Button type="button" variant="secondary" size="icon" aria-label="Cadastrar um bloco novo" title="Cadastrar um bloco novo" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo bloco</AlertDialogTitle>
            <AlertDialogDescription>O bloco é cadastrado neste condomínio e já fica escolhido na unidade.</AlertDialogDescription>
          </AlertDialogHeader>
          <FormProvider {...methods}>
            <form
              noValidate
              id="new-block"
              // O diálogo é aberto de dentro da página da unidade (na árvore do React): sem isto o envio subiria para o formulário dela.
              onSubmit={(event) => {
                event.stopPropagation();
                void handleSubmit(submit)(event);
              }}
              className="space-y-4"
            >
              <div className="flex flex-col">
                <span className="mb-1.5 text-caption font-medium text-ink-soft">Condomínio</span>
                <p className="flex h-9 items-center truncate rounded-control bg-surface-muted px-3 text-body">
                  {condominium ? `${formatCode(condominium.code)} · ${condominium.name}` : "…"}
                </p>
              </div>
              <TextField name="name" label="Bloco" required maxLength={60} autoComplete="off" placeholder="Ex.: Bloco A" />
            </form>
          </FormProvider>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="submit" form="new-block" disabled={createBlock.isPending}>
              {createBlock.isPending ? "Salvando…" : "Cadastrar bloco"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
