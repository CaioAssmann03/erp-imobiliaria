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
- Radii: `rounded-shell` 28 · `rounded-card` 20 · `rounded-panel` 14 · `rounded-control` 12 (inputs and fields) · `rounded-button` 8 · `rounded-badge` 4. Shadows: `shadow-card`, `shadow-float`.
- **Buttons, badges, chips and filter pills are never oval or circular**: a button, a link button, an icon button, a chip, a tab/section pill, a counter or a select-in-a-pill takes `rounded-button` (8 px; `Button` and `buttonVariants` already do), a small badge or counter (up to 20 px tall, like the filter count or the *Em breve* label) takes `rounded-badge`, a floating bar or toolbar that holds them takes `rounded-panel`. `rounded-full` is only for things that are a shape, not a control: status dots, progress bars and chart dots, the grab handle of a sheet, the marker line of the section index, and the track and knob of the settings switch. `tests/rounded-shapes.test.mjs` fails on a new `rounded-full` outside those files.
- **No divider lines**: separate with space and surfaces, not `border`.
- Density: buttons `h-8` (sm `h-7`), inputs `h-9`, table rows `py-2`, card padding 20 px, shell max `90rem`, forms up to 3 columns.
- Glass (`glass-pill`, `glass`) only where something overlaps (header search, Spotlight, floating menus).
- Modals (search, settings, the dashboard focus view, confirmations, sheets, and the module menu card that opens from the rail) share one backdrop, `modalBackdropClass` in `lib/theme/ui.ts`: black at 30%, so the page is only a little darker. The modals in the middle of the screen (confirmations, search, settings, the focus view) use `centeredModalBackdropClass` instead: the same, plus `backdrop-blur-sm` to focus the modal. Sheets and the module menu keep the plain one, with no blur. The left rail sits above it (`z-[60]`) and is **not** dimmed; give a new modal the same class with its own `z-` (40 or 50).
- Components: `Button` (variants default/brand/secondary/ghost/destructive/link; sizes default/sm/lg/icon), `Card`, `Badge`, `Input`, `Table`,
  plus shared `PageHeader`, `LinkButton`, `StatusText`, `ConfirmDeleteButton`, `FilterMenu`, `Pagination`, `data-list/`, `form/`.

## Theming (Settings)
Preferences are **cookies** (`ui_mode`, `ui_accent`, `ui_accent_custom`, `ui_font`, `ui_text`, `ui_motion`) → attributes on `<html>` (`data-mode`, `data-accent`, `data-font`, `data-text`, `data-motion`);
CSS swaps variables only. The server does not read them (the HTML is the same for everyone): an inline script in the root layout's `<head>` (`APPEARANCE_INIT_SCRIPT`, `lib/theme/appearance.ts`) copies the cookies to `<html>` before the first paint, so there is no flash. The shell is the same for every mode and accent (spec 049): a narrow icon **rail** (`shell/rail/Rail.tsx`) whose modules open a **module menu** card (`shell/menu/ModuleMenu.tsx`, data in `lib/navigation/module-menu.ts`); both use only the tokens above, so a new mode or accent reaches them with no extra CSS.

| Preference | Values | Default |
|---|---|---|
| Mode | `dark`, `light`, `system` | `dark` |
| Accent | `orange` (our brand color, the default) or `custom` (any #rrggbb from the color picker, cookie `ui_accent_custom`); no other presets | orange |
| Font | Inter, DM Sans, Source Serif, system | Inter |
| Text size | `normal` (100%), `large` (112.5%), `xlarge` (125%): the root `font-size`, so every rem scales, and so do the breakpoints (see *Text size and breakpoints*) | `normal` |
| Animations and effects (`motion`) | `auto`, `full`, `reduced`: the **lite mode**, see below | `auto` |

Defined in `lib/theme/appearance.ts` (`DEFAULT_APPEARANCE`, `ACCENTS`...); validated by `parseAppearance` and, in the script, by the same lists; applied by
`lib/theme/apply-appearance.ts` (cookie 1 year, `SameSite=Lax`). 
A `custom` accent is two CSS variables on `<html>` (`--accent-custom`, `--accent-foreground`, the readable text color, set by the head script and `applyAppearance`); `html[data-accent="custom"]` derives `--color-brand-strong/-light` from it with `color-mix`. The settings row shows the orange dot (the default) and, beside it, a rainbow dot that opens the device color picker plus a hex field.
Never hardcode a theme color; never use `localStorage` for appearance.

**Lite mode (weak machines, performance options).** The head script also detects the device (`data-device`: `reduce` when the OS asks for less motion, `lite` on data saver, no hardware acceleration (WebGL with `failIfMajorPerformanceCaveat` returns nothing) or a very weak machine (≤ 2 cores / ≤ 2 GB), else `standard` (a common laptop with a GPU stays on the full version); a browser that reports nothing counts as standard) and sets the effective mode `data-perf="lite|full"` (`resolvePerf` in `lib/theme/appearance.ts`, mirrored in the script; `applyAppearance` recomputes it when the preference changes). Lite = `reduced`, or an OS request for less motion (wins even over `full`), or `auto` on a `lite` device. In lite mode `app/globals.css` cuts animations and transitions, removes every `backdrop-filter` and makes `glass`/`glass-pill` solid; the Tailwind variant `lite:` (`lite:bg-shell`) gives a bar that relied on blur an opaque background. `@media (prefers-reduced-transparency)` drops blur and glass in any mode. JS effects (motion/react, canvases, the globe, Lenis) read the same attribute: `useLite()` in components, `isLite()` inside effects (`lib/theme/use-lite.ts`), and each already has a still branch. **A new animation, blur or canvas must honor it**: never `useReducedMotion` or `matchMedia("(prefers-reduced-motion)")` on its own (`tests/app-shell.test.mjs` fails on it), and keep the screen working without the effect.

The **Configurações** window (`shell/SettingsDialog.tsx`) is a quiet two-pane dialog: a left pane with the title and three text tabs (a row on a phone) and, on the right, the tab's name and one line, then **rows** separated by hairlines (`SettingsGroup` + `SettingsRow` in `shell/settings/SettingsSection.tsx`: name and explanation on the left, the control on the right). Controls are few and small: `SegmentedControl` (theme, font shown in its own typeface, text size), color dots (accent) and `SettingsSwitch`. No cards, previews or icons; it closes with the X (a *Concluir* button only on a phone). Tabs: **Aparência** (theme, accent, font), **Acessibilidade** (text size, *Animações e efeitos*: Automático / Completos / Reduzidos, `shell/settings/MotionSection.tsx`) and **Navegação** (the sidebar's *Nome dos módulos* switch, which is the rail's `localStorage` state, and the keyboard shortcuts list). *Restaurar padrão* resets the appearance cookies only. Add a preference as a row component in `shell/settings/` plus a tab entry; a cookie-backed one also goes in `lib/theme/appearance.ts` (list, default, cookie, init script) and both `apply-appearance.ts` files.

## Text size and breakpoints
`rem` inside a media query is always 16px, so raising the root `font-size` alone would leave `lg:`/`xl:` on as if the screen still had the old room: at 125% a 1280px window has 1024px of "rem" space but kept the wide layout and squeezed the 3-column forms. `lib/postcss/zoom-breakpoints.mjs` (a PostCSS plugin after Tailwind, in `postcss.config.mjs`) rewrites every width media query in rem into three copies, one per text size, with the limit multiplied by the factor (1, 1.125, 1.25) and the selectors scoped by `:where(html[data-text=…])` (no extra specificity). A bigger text size therefore switches to the layout of a smaller screen, like browser zoom, and components keep writing `lg:`/`xl:`. Left alone: queries not about width in rem and any media block that styles `html`/`:root` (the 16px phone inputs in `globals.css`). JS `matchMedia` width queries do not scale; prefer CSS. The desktop rail scrolls (`overflow-y-auto`) when the zoom leaves no height for its buttons. Covered by `tests/zoom-breakpoints.test.mjs`.
