"use client";

import { Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";

import { FormErrorSummary } from "./FormErrorSummary";

/**
 * Barra de ações flutuante no rodapé (vidro, sobre o conteúdo que rola): à esquerda o aviso de alterações não
 * salvas, à direita as ações extras (Cancelar…) e o Salvar, com o estado de envio. O resumo de erros fica acima.
 */
export function FormActions({
  isSubmitting,
  submitLabel = "Salvar",
  children,
}: {
  isSubmitting: boolean;
  submitLabel?: string;
  children?: React.ReactNode;
}) {
  const {
    formState: { isDirty },
  } = useFormContext();

  return (
    <>
      <FormErrorSummary />
      <div className="sticky bottom-[4.75rem] z-10 lg:bottom-4">
        <div className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card px-4 py-3">
          <p aria-live="polite" className="flex min-h-5 items-center gap-2 text-caption text-ink-soft">
            {isDirty && (
              <>
                <span className="size-1.5 rounded-full bg-warning" />
                Alterações não salvas
              </>
            )}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {children}
            <Button type="submit" disabled={isSubmitting} className="min-w-24">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Salvando…" : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
