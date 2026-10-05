import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ErrorItem, ErrorResponse } from "@/lib/api/generated/models";

import { errorMessage } from "./error-messages";

/** Os erros do backend: `{errors: [{field, code, message}]}` (spec 006). */
function readErrors(data: unknown): ErrorItem[] | null {
  if (!data || typeof data !== "object") return null;
  const errors = (data as Partial<ErrorResponse>).errors;
  return Array.isArray(errors) ? errors : null;
}

/**
 * Os campos do formulário são planos e usam o nome do campo da API; um erro aninhado
 * (`address.city`, `unit_people.0.person`) vale para o último nome do caminho.
 */
function formFieldName(path: string): string {
  const names = path.split(".").filter((name) => !/^\d+$/.test(name));
  return names[names.length - 1] ?? path;
}

/**
 * Aplica os erros de validação do backend nos campos do formulário, traduzidos pelo
 * código. Retorna uma mensagem geral para exibir em toast.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): string {
  if (!isAxiosError(error) || !error.response) {
    return "Sem conexão com o servidor. Tente novamente.";
  }

  const { status, data } = error.response;
  const errors = readErrors(data);
  if (status === 400 && errors) {
    let applied = 0;
    let general: string | undefined;

    for (const { field, code, message } of errors) {
      const translated = errorMessage(code, message);
      if (field === null) {
        general = translated;
        continue;
      }
      setError(
        formFieldName(field) as Path<T>,
        { type: "server", message: translated },
        { shouldFocus: applied === 0 }
      );
      applied += 1;
    }

    if (general) {
      // Erro que não é de um campo: o resumo do formulário o exibe (além do toast).
      setError("root.server" as Path<T>, { type: "server", message: general });
      return general;
    }
    if (applied > 0) return "Corrija os campos destacados.";
  }

  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status >= 500) return "Erro no servidor. Tente novamente em instantes.";
  return "Não foi possível salvar. Tente novamente.";
}
