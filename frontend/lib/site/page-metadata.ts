import type { Metadata } from "next";

import { SITE_NAME } from "./site.ts";

// A imagem de compartilhamento do site (`app/opengraph-image.tsx`): o `openGraph` de uma página substitui o do layout,
// e com ele a imagem que o Next acrescentaria sozinha.
const SHARE_IMAGE = "/opengraph-image";

/**
 * Metadados de uma página pública: título, descrição, canonical e Open Graph juntos. O `openGraph` de uma página
 * substitui o do layout, por isso ele é montado inteiro aqui (a URL relativa é resolvida pelo `metadataBase` da raiz).
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "pt_BR",
      url: path,
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [SHARE_IMAGE] },
  };
}
