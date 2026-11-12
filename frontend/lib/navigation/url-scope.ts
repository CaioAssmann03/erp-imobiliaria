// Só importa `uuid-param.ts`, com extensão: os módulos `*-workspace.ts` que usam este são testados direto pelo Node (que só resolve imports relativos com extensão).
import { uuidParam } from "../api/uuid-param.ts";

/** O que as listas leem da URL: `useSearchParams()` no navegador, `URLSearchParams` nos testes. */
export interface UrlParams {
  get: (name: string) => string | null;
}

/** O escopo de uma lista que se corta por condomínio ("" = sem condomínio). Viaja na URL (`?condominium=`). */
export interface CondominiumScope {
  condominium: string;
}

/** O escopo de uma lista por condomínio e mês de referência (primeiro dia, "2026-10-01"; "" = todos os meses). */
export interface CondominiumMonthScope extends CondominiumScope {
  month: string;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])-01$/;

/** Um mês lido da URL; só um primeiro dia de mês vale (o valor entra num endereço e numa consulta). */
export const monthParam = (value: string | null) => (value && MONTH.test(value) ? value : null);

/** O condomínio lido de `?condominium=`: só um UUID vale. */
export const condominiumScope = (params: UrlParams): CondominiumScope => ({ condominium: uuidParam(params.get("condominium")) ?? "" });

/** O condomínio e o mês lidos de `?condominium=&reference_month=`: o que não for UUID ou primeiro dia de mês fica vazio. */
export const condominiumMonthScope = (params: UrlParams): CondominiumMonthScope => ({
  ...condominiumScope(params),
  month: monthParam(params.get("reference_month")) ?? "",
});

/** Um endereço com os parâmetros que têm valor (os vazios saem); sem nenhum, só o caminho. */
export function scopeUrl<Query extends { [Name in keyof Query]: string }>(path: string, query: Query): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries<string>(query)) if (value) params.set(name, value);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

/** O endereço de uma tela com o escopo de condomínio e mês (`?condominium=&reference_month=`), a que `condominiumMonthScope` lê de volta. */
export const monthScopeUrl = (path: string, scope: CondominiumMonthScope) =>
  scopeUrl(path, { condominium: scope.condominium, reference_month: scope.month });

/** O escopo da inadimplência: condomínio, unidade e mês de referência (`?condominium=&unit=&reference_month=`). */
export interface DelinquencyScope extends CondominiumMonthScope {
  unit: string;
}

/** O condomínio, a unidade e o mês lidos da URL; o que não for UUID ou primeiro dia de mês fica vazio. */
export const delinquencyScope = (params: UrlParams): DelinquencyScope => ({
  ...condominiumMonthScope(params),
  unit: uuidParam(params.get("unit")) ?? "",
});

/** O endereço da inadimplência com o escopo (os vazios saem), o que `delinquencyScope` lê de volta. */
export const delinquencyScopeUrl = (path: string, scope: DelinquencyScope) =>
  scopeUrl(path, { condominium: scope.condominium, unit: scope.unit, reference_month: scope.month });
