---
summary: Design tokens, density, glass, components and theming (mode, accent, font).
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
- Modals (search, settings, the dashboard focus view, confirmations, sheets, and the module menu card that opens from the rail) share one backdrop, `modalBackdropClass` in `lib/ui.ts`: black at 30%, so the page is only a little darker. The modals in the middle of the screen (confirmations, search, settings, the focus view) use `centeredModalBackdropClass` instead: the same, plus `backdrop-blur-sm` to focus the modal. Sheets and the module menu keep the plain one, with no blur. The left rail sits above it (`z-[60]`) and is **not** dimmed; give a new modal the same class with its own `z-` (40 or 50).
- Components: `Button` (variants default/brand/secondary/ghost/destructive/link; sizes default/sm/lg/icon), `Card`, `Badge`, `Input`, `Table`,
  plus shared `PageHeader`, `LinkButton`, `StatusBadge`, `ConfirmDeleteButton`, `FilterMenu`, `Pagination`, `data-list/`, `form/`.

## Theming (Settings)
Preferences are **cookies** (`ui_mode`, `ui_accent`, `ui_accent_custom`, `ui_font`, `ui_text`, `ui_motion`) → attributes on `<html>` (`data-mode`, `data-accent`, `data-font`, `data-text`, `data-motion`);
CSS swaps variables only. The server does not read them (the HTML is the same for everyone): an inline script in the root layout's `<head>` (`APPEARANCE_INIT_SCRIPT`, `lib/appearance.ts`) copies the cookies to `<html>` before the first paint, so there is no flash. The shell is the same for every mode and accent (spec 049): a narrow icon **rail** (`shell/Rail.tsx`) whose modules open a **module menu** card (`shell/ModuleMenu.tsx`, data in `lib/module-menu.ts`); both use only the tokens above, so a new mode or accent reaches them with no extra CSS.

| Preference | Values | Default |
|---|---|---|
| Mode | `dark`, `light`, `system` | `dark` |
| Accent | `orange` (our brand color, the default) or `custom` (any #rrggbb from the color picker, cookie `ui_accent_custom`); no other presets | orange |
| Font | Inter, DM Sans, Source Serif, system | Inter |
| Text size | `normal` (100%), `large` (112.5%), `xlarge` (125%): the root `font-size`, so every rem scales | `normal` |
| Motion | `full`, `reduced` (animations and transitions cut to ~0 by `html[data-motion="reduced"]`) | `full` |

Defined in `lib/appearance.ts` (`DEFAULT_APPEARANCE`, `ACCENTS`...); validated by `parseAppearance` and, in the script, by the same lists; applied by
`shell/settings/apply-appearance.ts` (cookie 1 year, `SameSite=Lax`). 
A `custom` accent is two CSS variables on `<html>` (`--accent-custom`, `--accent-foreground`, the readable text color, set by the head script and `applyAppearance`); `html[data-accent="custom"]` derives `--color-brand-strong/-light` from it with `color-mix`. The settings row shows the orange dot (the default) and, beside it, a rainbow dot that opens the device color picker plus a hex field.
Never hardcode a theme color; never use `localStorage` for appearance.

The **Configurações** window (`shell/SettingsDialog.tsx`) is a quiet two-pane dialog: a left pane with the title and three text tabs (a row on a phone) and, on the right, the tab's name and one line, then **rows** separated by hairlines (`SettingsGroup` + `SettingsRow` in `shell/settings/SettingsSection.tsx`: name and explanation on the left, the control on the right). Controls are few and small: `SegmentedControl` (theme, font shown in its own typeface, text size), color dots (accent) and `SettingsSwitch`. No cards, previews or icons; it closes with the X (a *Concluir* button only on a phone). Tabs: **Aparência** (theme, accent, font), **Acessibilidade** (text size, reduce animations) and **Navegação** (the sidebar's *Nome dos módulos* switch, which is the rail's `localStorage` state, and the keyboard shortcuts list). *Restaurar padrão* resets the appearance cookies only. Add a preference as a row component in `shell/settings/` plus a tab entry; a cookie-backed one also goes in `lib/appearance.ts` (list, default, cookie, init script) and both `apply-appearance.ts` files.
