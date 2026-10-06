import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Rótulo + controle + dica/erro (o erro tem prioridade) numa linha de altura fixa. */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label
        htmlFor={id}
        className="mb-1.5 text-caption font-medium text-ink-soft"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-brand" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {/* Linha de mensagem sempre reservada: erro/dica não empurram os campos abaixo. */}
      <p
        id={`${id}-message`}
        role={error ? "alert" : undefined}
        className={cn(
          "mt-1.5 flex min-h-4 items-start gap-1.5 text-caption leading-4",
          error ? "text-danger" : "text-ink-faint",
        )}
      >
        {error && <CircleAlert aria-hidden className="mt-px size-3 shrink-0" />}
        {error ?? hint}
      </p>
    </div>
  );
}
