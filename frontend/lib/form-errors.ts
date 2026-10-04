import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Traduz mensagens padrão do DRF para o usuário. */
function translate(message: string) {
  const text = message.toLowerCase();
  if (
    text.includes("already exists") ||
    text.includes("must make a unique set") ||
    text.includes("já existe")
  ) {
    return "Já existe um cadastro com este valor.";
  }
  if (text.includes("may not be blank") || text.includes("may not be null") || text.includes("required")) {
    return "Campo obrigatório.";
  }
  if (text.includes("valid email")) return "Email inválido.";
  if (text.includes("no more than") && text.includes("characters")) return "Texto muito longo.";
  if (text.includes("valid integer") || text.includes("a valid number")) return "Número inválido.";
  if (text.includes("invalid pk") || text.includes("does not exist")) return "Seleção inválida.";
  return message;
}

/**
 * O DRF aninha os erros de serializers aninhados (`{address: {city: ["..."]}}`). Os campos
 * do formulário são planos e usam o nome do campo da API, então só o último nível importa.
 */
function flattenErrors(data: Record<string, unknown>): [string, string][] {
  const result: [string, string][] = [];
  for (const [field, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenErrors(value as Record<string, unknown>));
    } else {
      result.push([field, String(Array.isArray(value) ? value[0] : value)]);
    }
  }
  return result;
}

/**
 * Aplica os erros de validação do backend (DRF: `{campo: ["mensagem"]}`) nos campos
 * do formulário. Retorna uma mensagem geral para exibir em toast.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): string {
  if (!isAxiosError(error) || !error.response) {
    return "Sem conexão com o servidor. Tente novamente.";
  }

  const { status, data } = error.response;
  if (status === 400 && data && typeof data === "object") {
    let applied = 0;
    let general: string | undefined;

    for (const [field, messages] of flattenErrors(data as Record<string, unknown>)) {
      const message = translate(messages);
      if (field === "non_field_errors" || field === "detail") {
        general = message;
        continue;
      }
      setError(field as Path<T>, { type: "server", message }, { shouldFocus: applied === 0 });
      applied += 1;
    }

    if (general) return general;
    if (applied > 0) return "Corrija os campos destacados.";
  }

  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status >= 500) return "Erro no servidor. Tente novamente em instantes.";
  return "Não foi possível salvar. Tente novamente.";
}
