"use client";

import { describeField } from "@/lib/form-labels";
import {
  useFormContext,
  type FieldErrors,
  type FieldValues,
} from "react-hook-form";

interface ErrorEntry {
  name: string;
  message: string;
}

/** Erros dos campos (inclusive aninhados), na ordem em que o formulário os guarda. */
function collectErrors(
  errors: FieldErrors<FieldValues>,
  prefix = "",
): ErrorEntry[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    if (key === "root" || !value || typeof value !== "object") return [];
    const name = prefix ? `${prefix}.${key}` : key;
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") return [{ name, message }];
    return collectErrors(value as FieldErrors<FieldValues>, name);
  });
}

/** O rótulo visível do campo (sem o asterisco de obrigatório), lido do DOM. */
function labelOf(name: string): string | null {
  const input = document.querySelector<HTMLElement>(
    `[name="${CSS.escape(name)}"]`,
  );
  const label = input?.id
    ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`)
    : null;
  if (!label) return null;
  const copy = label.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("[aria-hidden]").forEach((node) => node.remove());
  return copy.textContent?.trim() || null;
}

/**
 * Resumo dos erros do formulário, logo acima da barra de ações (que fica visível ao rolar):
 * aparece depois de uma tentativa de salvar e lista o erro geral do servidor e cada campo com
 * problema; clicar leva ao campo. Cada campo continua mostrando o próprio erro.
 */
export function FormErrorSummary() {
  const {
    formState: { errors, submitCount },
    setFocus,
  } = useFormContext();

  const general = (errors.root?.server as { message?: string } | undefined)
    ?.message;
  const fields = collectErrors(errors);
  if (submitCount === 0 || (!general && fields.length === 0)) return null;

  return (
    <div role="alert" className="mb-3 rounded-card bg-card p-4 shadow-card">
      <p className="text-body font-medium">
        {general ??
          (fields.length === 1 ? "Há 1 campo para corrigir" : `Há ${fields.length} campos para corrigir`)}
      </p>
      {fields.length > 0 && (
        <ul className="-mx-2 mt-2">
          {fields.map(({ name, message }) => {
            const label = typeof document === "undefined" ? null : labelOf(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => setFocus(name)}
                  className="grid w-full grid-cols-1 gap-x-4 rounded-control px-2 py-1.5 text-left text-caption outline-none transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted sm:grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)]"
                >
                  <span className="font-medium text-ink">{describeField(name, label)}</span>
                  <span className="text-danger">{message}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
