import { cache } from "react";

import { makeQueryClient } from "./make-query-client";

/**
 * Cliente do servidor: um por requisição (`cache` do React), nunca
 * compartilhado entre usuários. Use apenas em Server Components.
 */
export const getServerQueryClient = cache(makeQueryClient);
