/** Região de uma tela para aproximar: centro em % da imagem e aumento. */
export type ScreenFocus = { readonly x: number; readonly y: number; readonly zoom: number };

export type ZoomTransform = { scale: number; x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Transformação (origem no canto superior esquerdo, `x` e `y` em % do próprio quadro) que leva o centro da região ao centro
 * do quadro sem mostrar nada além das bordas da imagem. Sem região, a tela inteira.
 */
export function zoomTransform(focus: ScreenFocus | null): ZoomTransform {
  if (!focus || focus.zoom <= 1) return { scale: 1, x: 0, y: 0 };
  const limit = 100 - 100 * focus.zoom;
  return {
    scale: focus.zoom,
    x: clamp(50 - focus.x * focus.zoom, limit, 0),
    y: clamp(50 - focus.y * focus.zoom, limit, 0),
  };
}
