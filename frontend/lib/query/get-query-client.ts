import { isServer, QueryClient } from "@tanstack/react-query";

import { makeQueryClient } from "./make-query-client";

let browserQueryClient: QueryClient | undefined;

/** Cliente do navegador: singleton, para o cache sobreviver às navegações. */
export function getBrowserQueryClient() {
  if (isServer) return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}
