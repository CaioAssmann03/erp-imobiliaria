/**
 * Qual seção da página está em vista, para destacá-la no menu das seções (spec 038). Função pura, sem imports do app:
 * roda direto no `node --test`.
 */

/** A posição de uma seção: o `id` e a distância do seu topo ao topo da área visível (negativa: já passou). */
export interface SectionPosition {
  id: string;
  top: number;
}

/**
 * A seção em vista é a última cujo topo já chegou à linha de leitura (`offset` px abaixo do topo da área visível);
 * antes de qualquer uma chegar vale a primeira, e no fim da página vale a última (uma seção curta nunca chegaria à linha).
 * `positions` vem na ordem da página.
 */
export function activeSectionId(
  positions: readonly SectionPosition[],
  offset: number,
  isAtPageEnd = false,
): string | undefined {
  if (isAtPageEnd) return positions.at(-1)?.id;
  let active = positions[0]?.id;
  for (const position of positions) {
    if (position.top <= offset) active = position.id;
  }
  return active;
}
