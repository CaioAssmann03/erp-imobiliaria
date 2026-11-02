"use client";

import { useSearchParams } from "next/navigation";

import type { UrlParams } from "@/lib/navigation/url-scope";

/** O escopo de uma lista lido da URL com o `parse` do módulo (a lista da moldura o troca, as telas o seguem). */
export function useUrlScope<T>(parse: (params: UrlParams) => T): T {
  return parse(useSearchParams());
}
