type Rgb = [number, number, number];

function parseHex(value: string): Rgb | null {
  const hex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
  return hex ? [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)] : null;
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * t) as Rgb;

/**
 * Rampa de tons do destaque do tema, do queimado (0) ao claro (1), lida dos tokens `--color-brand*` do elemento.
 * É a cor dos prédios do login e da home: uma só rampa para os dois não divergirem.
 */
export function brandRamp(element: HTMLElement) {
  const style = getComputedStyle(element);
  const token = (name: string, fallback: string) => parseHex(style.getPropertyValue(name).trim()) ?? parseHex(fallback)!;
  const strong = token("--color-brand-strong", "#d9481a");
  const deep = mix(strong, [48, 14, 4], 0.55);
  const mid = token("--color-brand", "#f05a28");
  const light = token("--color-brand-light", "#ff7a45");
  const pale = mix(light, [255, 255, 255], 0.62);
  return (t: number) => {
    const rgb =
      t < 0.25 ? mix(deep, strong, t / 0.25)
      : t < 0.55 ? mix(strong, mid, (t - 0.25) / 0.3)
      : t < 0.8 ? mix(mid, light, (t - 0.55) / 0.25)
      : mix(light, pale, (t - 0.8) / 0.2);
    return `rgb(${rgb.map(Math.round).join(",")})`;
  };
}
