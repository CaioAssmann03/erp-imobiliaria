import { useState } from "react";

import { LIST_PAGE_SIZE } from "@/lib/api/list-size";

/**
 * O limite de uma lista que mostra uns poucos registros e cresce com "Mostrar mais". Volta ao tamanho inicial quando a `key`
 * muda (a busca, um filtro ou o condomínio): a lista nova começa de novo pelo começo.
 */
export function useGrowingLimit(key: string, step = LIST_PAGE_SIZE) {
  const [grown, setGrown] = useState({ key, limit: step });
  const limit = grown.key === key ? grown.limit : step;
  const showMore = () => setGrown({ key, limit: limit + step });
  return { limit, showMore };
}
