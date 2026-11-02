---
summary: Accessibility rules and page metadata/SEO.
read-when: you build interactive UI or touch titles/metadata
skip-if: component rules → norms/components.md
---
# Accessibility and SEO (S — Safeguards)

## Accessibility
- One `h1` per page (`PageHeader`), logical heading order; real elements (`button` actions, `a`/`Link` navigation, `ul/li`, `table`); one `main`.
- Every input has a linked `label`; errors use `aria-invalid` + visible text (`aria-describedby`); required fields marked; hints are text, not placeholders
  (`components/form/fields/` already does this).
- Everything keyboard operable, logical tab order, visible focus ring. Dialogs/menus: focus in, trapped, `Esc` closes, focus returns (Base UI does it; do not
  break it). Clickable cards (`WidgetCard`) support `Enter`/`Space` and `tabIndex={0}`.
- Icon-only controls: `aria-label` + `title` (Portuguese); decorative icons `aria-hidden`; meaningful images `alt`; charts need a nearby text summary;
  hidden labels use `sr-only`.
- Color: contrast comes from the tokens in both modes; never red/green alone (status has text + dot); keep decorative motion subtle.
- `<html lang="pt-BR">`; all user text Portuguese.

## SEO and metadata
The ERP is behind a login; only the public pages (`app/(marketing)`) are meant to be indexed.
- Every `page.tsx` exports `metadata = { title: "Condomínios" }`; the root layout template makes it "Condomínios · METRI".
  `generateMetadata` only when the title depends on data.
- The first HTML is the shell (title, header); the data arrives from the client with a skeleton and a busy state. Descriptive link text ("Editar condomínio"), not "clique aqui".
- Authenticated pages are not indexed: `(dashboard)/layout.tsx` and the login page set `robots: { index: false, follow: false }`, and `app/robots.ts` disallows the ERP paths (`PRIVATE_PATHS` in `lib/site/public-pages.ts`).
- A public page uses `pageMetadata` (title, description, canonical, Open Graph, Twitter) and is listed in `PUBLIC_PAGES`, which feeds `app/sitemap.ts` and `proxy.ts`; see `norms/marketing.md`. The page-level `openGraph` replaces the layout's, so never write it by hand.
- The site address comes from `NEXT_PUBLIC_SITE_URL` (read at build time, default `http://localhost:3000`; the root layout's `metadataBase`, the canonical, the sitemap and the JSON-LD use it). Set it in production, as a build arg in the `Dockerfile`.
- Structured data (`<JsonLd>`): `Organization` and `SoftwareApplication` on the home, only facts the site states (no price, rating or address).
