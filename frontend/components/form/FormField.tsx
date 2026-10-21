import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { FieldHint } from "./FieldHint";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  /** Explicação do campo: aparece atrás de um ícone de ajuda ao lado do rótulo, não solta sob o campo. */
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Rótulo (com o ícone de ajuda, se houver dica) + controle + a linha do erro. A linha do erro é sempre reservada:
 * um erro que aparece não empurra os campos abaixo. A dica fica na mesma linha, só para leitor de tela.
 */
export function FormField({ id, label, required, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={id} className="text-caption font-medium text-ink-soft">
          {label}
          {required && (
            <span className="ml-0.5 text-brand" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {hint && <FieldHint label={label}>{hint}</FieldHint>}
      </div>
      {children}
      <p
        id={`${id}-message`}
        role={error ? "alert" : undefined}
        className="mt-1.5 flex min-h-4 items-start gap-1.5 text-caption leading-4 text-danger"
      >
        {error ? (
          <>
            <CircleAlert aria-hidden className="mt-px size-3 shrink-0" />
            {error}
          </>
        ) : (
          hint && <span className="sr-only">{hint}</span>
        )}
      </p>
    </div>
  );
}
