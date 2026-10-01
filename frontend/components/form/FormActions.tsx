import { Button } from "@/components/ui/button";

/** Barra de ações fixa no rodapé: Salvar (com estado de envio) + extras (Cancelar…). */
export function FormActions({
  isSubmitting,
  submitLabel = "Salvar",
  children,
}: {
  isSubmitting: boolean;
  submitLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center gap-2 rounded-card bg-card p-3 shadow-float">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
      {children}
    </div>
  );
}
