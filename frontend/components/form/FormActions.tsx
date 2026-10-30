"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FormErrorSummary } from "./FormErrorSummary";

/**
 * Barra de ações no rodapé, sólida e sem enfeite, fixa rente à borda de baixo da tela, sobre o conteúdo que rola: à esquerda o aviso de alterações
 * não salvas (só texto), na edição o Excluir logo antes dele, à direita as ações extras (Cancelar…) e o Salvar, com o estado de envio. Colada na borda
 * ela tem só os cantos de cima arredondados; ao chegar ao fim do formulário e se soltar, fica toda arredondada, como os cartões das seções. O resumo de erros
 * fica acima.
 */
export function FormActions({
  isSubmitting,
  submitLabel = "Salvar",
  submittingLabel = "Salvando…",
  formId,
  danger,
  children,
}: {
  isSubmitting: boolean;
  submitLabel?: string;
  /** O texto do botão enquanto envia (Emitindo…, Incluindo…). */
  submittingLabel?: string;
  /** `id` de um `<form>` fora da barra (a barra não precisa estar dentro dele). */
  formId?: string;
  /** Ação destrutiva (Excluir) à esquerda da barra, longe do Salvar; só em quem já existe (edição). */
  danger?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const {
    formState: { isDirty },
  } = useFormContext();

  // A barra fica 1 px além da borda de baixo (`-bottom-px`): colada, a tela a corta e ela aparece com menos de 100%; quando o formulário termina e ela
  // se solta, aparece inteira. É ela mesma que se observa, sem um contêiner extra, que tiraria a altura do formulário de que o `sticky` precisa.
  const [released, setReleased] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new IntersectionObserver(([entry]) => setReleased(entry.intersectionRatio >= 0.99), { threshold: [0, 0.5, 0.9, 0.99, 1] });
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <FormErrorSummary />
      <div ref={barRef} className="sticky -bottom-px z-10">
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 bg-card px-4 py-3 shadow-float transition-[border-radius] duration-200",
            released ? "rounded-card" : "rounded-t-card"
          )}
        >
          {danger}
          <p aria-live="polite" className="min-h-5 text-caption text-ink-soft">
            {isDirty ? "Alterações não salvas" : ""}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {children}
            <Button type="submit" form={formId} disabled={isSubmitting} className="min-w-24">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
