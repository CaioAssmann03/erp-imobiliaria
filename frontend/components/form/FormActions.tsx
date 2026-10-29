"use client";

import { Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";

import { FormErrorSummary } from "./FormErrorSummary";

/**
 * Barra de ações no rodapé, sólida e sem enfeite, fixa sobre o conteúdo que rola: à esquerda o aviso de alterações
 * não salvas (só texto), à direita as ações extras (Cancelar…) e o Salvar, com o estado de envio. O resumo de erros
 * fica acima.
 */
export function FormActions({
  isSubmitting,
  submitLabel = "Salvar",
  formId,
  children,
}: {
  isSubmitting: boolean;
  submitLabel?: string;
  /** `id` de um `<form>` fora da barra (a barra não precisa estar dentro dele). */
  formId?: string;
  children?: React.ReactNode;
}) {
  const {
    formState: { isDirty },
  } = useFormContext();

  return (
    <>
      <FormErrorSummary />
      <div className="sticky bottom-[4.75rem] z-10 lg:bottom-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card bg-card px-4 py-3 shadow-float">
          <p aria-live="polite" className="min-h-5 text-caption text-ink-soft">
            {isDirty ? "Alterações não salvas" : ""}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {children}
            <Button type="submit" form={formId} disabled={isSubmitting} className="min-w-24">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Salvando…" : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
