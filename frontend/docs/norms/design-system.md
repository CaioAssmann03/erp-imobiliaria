---
summary: Design tokens, density, glass, components and theming (accent, font; a single light theme).
read-when: you touch styling, colors, themes or settings
skip-if: component structure → norms/components.md; public pages (landing) → norms/marketing.md
---
# Design system and theming (N — Norms)

Source of truth: `app/globals.css` (Tailwind v4 `@theme`). shadcn tokens map to these. **Never** use hex, `text-sm`, `rounded-xl`.

| Token | Use |
|---|---|
| `canvas` / `shell` / `surface` | page / app frame / cards |
| `surface-muted` / `surface-sunken` | inner panels, inputs, table header / hover on muted |
| `ink`, `ink-soft`, `ink-faint` | text: primary / secondary / placeholder |
| `brand` (`-strong`, `-light`, `-soft`) | accent; sparingly (one highlight per screen, focus, action links) |
| `success`, `danger`, `warning` (+`-soft`) | **status only** |

- Primary action = dark `ink` button; accent is a highlight (`variant="brand"` for rare CTAs).
- Type (Inter): `text-display` 36 · `text-title` 24 · `text-heading` 16 · `text-body` 13 · `text-caption` 12; `tabular-nums` for numbers.
- Radii: `rounded-shell` 28 · `rounded-card` 20 · `rounded-panel` 14 · `rounded-control` 12 · `rounded-full`. Shadows: `shadow-card`, `shadow-float`.
- **No divider lines**: separate with space and surfaces, not `border`.
- Density: buttons `h-8` (sm `h-7`), inputs `h-9`, table rows `py-2`, card padding 20 px, shell max `90rem`, forms up to 3 columns.
- Glass (`glass-pill`, `glass`) only where something overlaps (header search, Spotlight, floating menus).
- Components: `Button` (variants default/brand/secondary/ghost/destructive/link; sizes default/sm/lg/icon), `Card`, `Badge`, `Input`, `Table`,
  plus shared `PageHeader`, `LinkButton`, `StatusBadge`, `ConfirmDeleteButton`, `FilterMenu`, `Pagination`, `data-list/`, `form/`.

## Theming (Settings)
There is **one theme, light** (the `:root` / `@theme` variables in `app/globals.css`): no dark or system mode, and no `dark:` utility classes. Preferences are **cookies** (`ui_accent`, `ui_font`) → attributes on `<html>` (`data-accent`, `data-font`);
CSS swaps variables only. The server does not read them (the HTML is the same for everyone): an inline script in the root layout's `<head>` (`APPEARANCE_INIT_SCRIPT`, `lib/appearance.ts`) copies the cookies to `<html>` before the first paint, so there is no flash. The sidebar works the same way (`sidebar_open` → `data-sidebar` on `<html>`, CSS variant `sidebar-closed` in `app/globals.css`). While a condominium is open (`condominiums/[id]/layout.tsx` renders `CollapseSidebar`) the sidebar is collapsed by default, without writing the cookie, so the saved choice applies again when leaving; opening it by hand there saves the choice as usual.

| Preference | Values | Default |
|---|---|---|
| Accent | orange, blue, green, violet, red, rose, graphite | orange |
| Font | Inter, DM Sans, Source Serif, system | Inter |

The `/login` page is a **public page**, not part of the ERP theme: `app/login/layout.tsx` wraps it in `.theme-public` with the home's `SiteHeader` (the "Entrar" button is hidden there), so it follows the public look (light + orange) and ignores the saved `ui_accent`/`ui_font`. Its skyscraper (`app/login/_components/skyscraper/`) is a big isometric cluster of square particles in tones of the public accent (`--color-brand-strong`/`brand`/`brand-light`, read from the canvas, not from `<html>`), small and fully in view beside the form: `scene.ts` draws one building made of different volumes (a low glazed podium, a long residential slab with white balcony slabs and glass rails, and a taller end tower with a set-back top; planters and a machine room on the roofs; wider than tall) on an offscreen canvas in grays (two facades per block, window grids), `particles.ts` samples it into particles (gray level → tone), `simulation.ts` raises it from below (the particles rise from under the scene, the ground ones first), switches a few windows on and off by itself and, as on the landing hero, the pointer lights the windows around it (smooth fall-off, fading back), plus a light push on the nearby particles (they spring back); it only redraws while something moves. `prefers-reduced-motion` keeps the still drawing.

Defined in `lib/appearance.ts` (`DEFAULT_APPEARANCE`, `ACCENTS`...); validated by `parseAppearance` and, in the script, by the same lists; applied by
`shell/settings/apply-appearance.ts` (cookie 1 year, `SameSite=Lax`). Reddish accents also override `--color-danger`.
Never hardcode a theme color; never use `localStorage` for appearance.
