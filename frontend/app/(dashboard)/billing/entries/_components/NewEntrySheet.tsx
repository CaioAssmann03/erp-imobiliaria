"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  billingEntryDefaults,
  billingEntrySchema,
  type BillingEntryFormInput,
  type BillingEntryFormOutput,
} from "@/lib/schemas/billing-entry";

import { EntryFormFields } from "./entry-form/EntryFormFields";
import { EntryPreview } from "./entry-form/EntryPreview";
import { useEntrySubmit } from "./entry-form/use-entry-submit";

interface NewEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Condomínio e mês (digitado, "10/2026") que a grade mostra: o formulário abre com eles. */
  condominium: string;
  month: string;
}

/** O painel "Novo lançamento": o formulário à esquerda e, à direita, o que cada unidade pagaria. */
export function NewEntrySheet({ open, onOpenChange, condominium, month }: NewEntrySheetProps) {
  const methods = useForm<BillingEntryFormInput, unknown, BillingEntryFormOutput>({
    resolver: zodResolver(billingEntrySchema),
    defaultValues: billingEntryDefaults(condominium, month),
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useEntrySubmit(() => onOpenChange(false), setError);

  // Cada abertura começa limpa, no condomínio e no mês da grade.
  useEffect(() => {
    if (open) reset(billingEntryDefaults(condominium, month));
  }, [open, condominium, month, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:w-full data-[side=right]:sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>Novo lançamento</SheetTitle>
          <SheetDescription>Valores que entram no boleto de cada unidade, além do plano de cobrança.</SheetDescription>
        </SheetHeader>
        <FormProvider {...methods}>
          <form
            noValidate
            onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <EntryFormFields />
              <div className="lg:sticky lg:top-0 lg:self-start">
                <EntryPreview />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-28">
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "Salvando…" : "Incluir lançamento"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
