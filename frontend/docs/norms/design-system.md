---
read-when: you touch colors, type, spacing, radii, shadows, themes or the settings dialog
size: medium
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
Preferences are **cookies** (`ui_mode`, `ui_accent`, `ui_font`) → attributes on `<html>` (`data-mode`, `data-accent`, `data-font`);
CSS swaps variables only. The server reads the cookies, so the first paint has the right theme (no flash).

| Preference | Values | Default |
|---|---|---|
| Mode | `dark`, `light`, `system` | `dark` |
| Accent | orange, blue, green, violet, red, rose, graphite | orange |
| Font | Inter, DM Sans, Source Serif, system | Inter |

Defined in `lib/appearance.ts` (`DEFAULT_APPEARANCE`, `ACCENTS`...); validated by `parseAppearance`; applied by
`shell/settings/apply-appearance.ts` (cookie 1 year, `SameSite=Lax`). Reddish accents also override `--color-danger`.
Never hardcode a theme color; never use `localStorage` for appearance.
