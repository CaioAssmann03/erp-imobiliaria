import { ImageResponse } from "next/og";

import { HOUSE_LOGO_PATH } from "@/components/HouseLogo";

export const contentType = "image/png";

// O ícone é desenhado fora da árvore de estilos: não lê `--color-brand`, por isso o laranja da marca fica aqui.
const BRAND_ORANGE = "#f05a28";

const SIZES = { small: 32, large: 192 } as const;
type IconId = keyof typeof SIZES;

// Dois tamanhos: o pequeno é o da aba do navegador; o grande serve a atalhos e telas de alta densidade.
export function generateImageMetadata() {
  return (Object.keys(SIZES) as IconId[]).map((id) => ({
    id,
    contentType,
    size: { width: SIZES[id], height: SIZES[id] },
  }));
}

/** O ícone da página: a casa branca sobre o quadrado laranja da marca. */
export default async function Icon({ id }: { id: Promise<string | number> }) {
  const side = SIZES[(await id) as IconId];
  const houseHeight = side * 0.6;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_ORANGE,
          borderRadius: side * 0.22,
        }}
      >
        <svg width={houseHeight * (1061.5 / 1120.5)} height={houseHeight} viewBox="0 0 1061.5 1120.5">
          <path d={HOUSE_LOGO_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: side, height: side },
  );
}
