export interface PublicPage {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}

/** Os módulos de Recursos que têm página própria (`/features/[slug]`, conteúdo em `MODULE_PAGES` de `content.ts`). */
export const MODULE_SLUGS = ["condominios", "lancamentos", "cobrancas", "assistente"] as const;
export type ModuleSlug = (typeof MODULE_SLUGS)[number];

/**
 * As páginas abertas ao público: fonte única do `sitemap.ts` e do `proxy.ts` (que as deixa passar sem login e sem
 * redirecionar quem já está logado). Página pública nova entra aqui.
 */
export const PUBLIC_PAGES: readonly PublicPage[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/features", changeFrequency: "monthly", priority: 0.8 },
  ...MODULE_SLUGS.map((slug) => ({ path: `/features/${slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contato", changeFrequency: "yearly", priority: 0.7 },
];

export const PUBLIC_PATHS: readonly string[] = PUBLIC_PAGES.map((page) => page.path);

/** Áreas do ERP: fora do índice dos buscadores (o `robots.ts` as bloqueia). */
export const PRIVATE_PATHS: readonly string[] = [
  "/api/",
  "/login",
  "/dashboard",
  "/condominiums",
  "/billing",
  "/finance",
  "/reports",
];
