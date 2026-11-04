---
summary: Design tokens, density, components, theming (mode, accent, font, lite mode) and the rules for each UI library.
read-when: you touch styling, colors, themes, settings, or use Tailwind, shadcn, lucide, sonner or recharts
skip-if: component structure → conventions/components.md; public pages (landing) → features/marketing.md
---
# Design system, theming and UI libraries

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
- Radii: `rounded-shell` 28 · `rounded-card` 20 · `rounded-panel` 14 · `rounded-control` 12 (inputs and fields) · `rounded-button` 8 · `rounded-badge` 4. Shadows: `shadow-card`, `shadow-float`, and `shadow-drawer` for the open side panel (the assistant).
- **Buttons, badges, chips and filter pills are never oval or circular**: a button, a link button, an icon button, a chip, a tab/section pill, a counter or a select-in-a-pill takes `rounded-button` (8 px; `Button` and `buttonVariants` already do), a small badge or counter (up to 20 px tall, like the filter count or the *Em breve* label) takes `rounded-badge`, a floating bar or toolbar that holds them takes `rounded-panel`. `rounded-full` is only for things that are a shape, not a control: status dots, progress bars and chart dots, the grab handle of a sheet, the marker line of the section index, and the track and knob of the settings switch. `tests/rounded-shapes.test.mjs` fails on a new `rounded-full` outside those files.
- **No divider lines** in the ERP: separate with space and surfaces, not `border`. The one exception is the rows of the Settings window (hairlines inside each grouped panel); the public pages allow thin rules (`features/marketing.md`).
- Density: buttons `h-8` (sm `h-7`), inputs `h-9`, table rows `py-2`, card padding 20 px, shell max `90rem`, forms up to 3 columns.
- **Clickable means `cursor: pointer`.** One base rule in `app/globals.css` gives it to buttons, links with `href`, `label[for]`, checkboxes, radios, selects, `summary` and the `role`s button/tab/menuitem/option/switch/checkbox/radio, unless disabled. Do not repeat `cursor-pointer` per component; a clickable `div` should be a `button` (or take `role="button"`). A disabled control keeps `cursor-not-allowed` set on the component.
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
Never hardcode a theme color; appearance lives in cookies, never `localStorage`. (`localStorage` is only for per-browser UI conveniences that the server never needs: the rail's expanded state, the dashboard card layout, the assistant switch; see `conventions/data-and-cache.md`.)

**Lite mode (weak machines, performance options).** The head script also detects the device (`data-device`: `reduce` when the OS asks for less motion, `lite` on data saver, no hardware acceleration (WebGL with `failIfMajorPerformanceCaveat` returns nothing) or a very weak machine (≤ 2 cores / ≤ 2 GB), else `standard` (a common laptop with a GPU stays on the full version); a browser that reports nothing counts as standard) and sets the effective mode `data-perf="lite|full"` (`resolvePerf` in `lib/theme/appearance.ts`, mirrored in the script; `applyAppearance` recomputes it when the preference changes). Lite = `reduced`, or an OS request for less motion (wins even over `full`), or `auto` on a `lite` device. In lite mode `app/globals.css` cuts animations and transitions, removes every `backdrop-filter` and makes `glass`/`glass-pill` solid; the Tailwind variant `lite:` (`lite:bg-shell`) gives a bar that relied on blur an opaque background. `@media (prefers-reduced-transparency)` drops blur and glass in any mode. JS effects (motion/react, canvases, the globe, Lenis) read the same attribute: `useLite()` in components, `isLite()` inside effects (`lib/theme/use-lite.ts`), and each already has a still branch. **A new animation, blur or canvas must honor it**: never `useReducedMotion` or `matchMedia("(prefers-reduced-motion)")` on its own (`tests/app-shell.test.mjs` fails on it), and keep the screen working without the effect.

The **Configurações** window (`shell/SettingsDialog.tsx`) is a roomy two-pane dialog (about 54 rem wide): a left pane on `surface-muted` with the title and four tabs, each with a small `lucide` icon (a row on a phone; the selected tab is a `surface` chip with `shadow-card`) and, on the right, the tab's name and one explanatory line, then **groups** (`SettingsGroup` + `SettingsRow` in `shell/settings/SettingsSection.tsx`): a soft `surface-muted` panel holding the rows, separated by a hairline, with the name and explanation on the left (explanation in `text-caption`, relaxed leading, at most ~26 rem wide) and the control on the right. A control that is wide or has several options (text size, animations, font, accent colors) goes **under** the text (`stacked`) and, when it is a `SegmentedControl`, takes the full width (`fullWidth`, equal segments on a `surface-sunken` track) so nothing is squeezed. Controls stay few and small: `SegmentedControl` (theme, font shown in its own typeface, text size, animations), color swatches (accent) and `SettingsSwitch`; keys in the shortcuts list are `kbd` chips. No previews; it closes with the X (a *Concluir* button only on a phone). Tabs: **Aparência** (theme, accent, font), **Acessibilidade** (text size, *Animações e efeitos*: Automático / Completos / Reduzidos, `shell/settings/MotionSection.tsx`), **Navegação** (the sidebar's *Nome dos módulos* switch, which is the rail's `localStorage` state, and the keyboard shortcuts list) and **Assistente** (the help button switch). *Restaurar padrão* (a quiet button with a small icon) resets the appearance cookies only. Add a preference as a row component in `shell/settings/` plus a tab entry; a cookie-backed one also goes in `lib/theme/appearance.ts` (list, default, cookie, init script) and both `apply-appearance.ts` files.

## Text size and breakpoints
`rem` inside a media query is always 16px, so raising the root `font-size` alone would leave `lg:`/`xl:` on as if the screen still had the old room: at 125% a 1280px window has 1024px of "rem" space but kept the wide layout and squeezed the 3-column forms. `lib/postcss/zoom-breakpoints.mjs` (a PostCSS plugin after Tailwind, in `postcss.config.mjs`) rewrites every width media query in rem into three copies, one per text size, with the limit multiplied by the factor (1, 1.125, 1.25) and the selectors scoped by `:where(html[data-text=…])` (no extra specificity). A bigger text size therefore switches to the layout of a smaller screen, like browser zoom, and components keep writing `lg:`/`xl:`. Left alone: queries not about width in rem and any media block that styles `html`/`:root` (the 16px phone inputs in `globals.css`). JS `matchMedia` width queries do not scale; prefer CSS. The desktop rail scrolls (`overflow-y-auto`) when the zoom leaves no height for its buttons. Covered by `tests/zoom-breakpoints.test.mjs`.

## Libraries

| Library | Use | Rule |
|---|---|---|
| Tailwind v4 | styling | token utilities only; mobile first (`sm:`/`md:`/`lg:`); never build class names dynamically (`bg-${x}` is purged); custom utilities via `@utility` in `globals.css` |
| shadcn/ui on Base UI | `components/ui/`, dialogs, menus | vendored: wrap instead of editing (`LinkButton`, `ConfirmDeleteButton`); overlays trap focus, close on `Esc`/outside click, need a title (`sr-only` if hidden) |
| `lucide-react` | icons | named imports; icon-only buttons need `aria-label` |
| `sonner` | toasts | one `<Toaster/>` in `app/layout.tsx`; **import `toast` from `@/lib/errors/toast`, never from `sonner`**; short non-technical Portuguese; one toast per user action, none for background refetches. Colors are opposite to the mode. `toast.error` is our `ErrorToast`: when its message came from `applyServerErrors` / `apiErrorMessage`, a click opens what the API answered (`lib/errors/error-details.ts`) |
| `recharts` | charts | inside small client components (`components/charts/`), plain data props, a nearby text summary; heavy screens: `next/dynamic` with `ssr:false` + skeleton |
| `cva`, `clsx`, `tailwind-merge` | variants/classes | use `cn()` from `lib/utils.ts` |
| `tw-animate-css` | enter/exit animation | utilities like `animate-in fade-in-0` |
| `next-themes` | only the shadcn `sonner` wrapper | the app theme is cookie-driven; never use it for the theme |
| `motion`, `lenis` | public pages only (`app/(marketing)`) | never in the ERP shell; honor the lite mode (`useLite()` / `isLite()`); import from `motion/react` |
