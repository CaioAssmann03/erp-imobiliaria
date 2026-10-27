import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";

/** Fonte mono dos rótulos das páginas públicas (`text-label`): a mesma em qualquer sistema operacional. */
export const labelMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-label-mono",
});

/**
 * Serifa dos títulos (`font-display`). No layout raiz ela só carrega sob demanda (é opcional no ERP);
 * aqui é pré-carregada, para o título do hero não trocar de fonte depois de aparecer.
 */
export const displaySerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display-serif",
});
