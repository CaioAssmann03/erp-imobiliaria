import { ImageResponse } from "next/og";

import { HOUSE_LOGO_PATH } from "@/components/brand/HouseLogo";
import { SITE_NAME } from "@/lib/site/site";

export const alt = "METRI — gestão para administradoras de condomínios";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Desenhada fora da árvore de estilos (como o `icon.tsx`): não lê tokens, por isso as cores da marca ficam aqui.
const BRAND_ORANGE = "#f05a28";
const INK = "#1c1b19";
const CANVAS = "#e9e9e8";

/** A imagem de compartilhamento de todas as páginas: a casa laranja, o nome e a frase do produto. */
export default function OpenGraphImage() {
  const houseHeight = 150;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: CANVAS,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width={houseHeight * (1061.5 / 1120.5)} height={houseHeight} viewBox="0 0 1061.5 1120.5">
            <path d={HOUSE_LOGO_PATH} fill={BRAND_ORANGE} />
          </svg>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>Condomínio em dia.</div>
          <div style={{ fontSize: 32, color: "#57534e" }}>
            Cadastro, cobrança, conciliação bancária e financeiro para administradoras de condomínios.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
