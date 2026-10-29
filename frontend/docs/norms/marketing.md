---
summary: Design system of the public pages (landing, features, how-it-works): type, colors, buttons, layout.
read-when: you touch anything under app/(marketing)
skip-if: the logged-in ERP → norms/design-system.md; folders and routes → structure/folders-and-routes.md
---
# Public pages design system (N — Norms)

The public pages (`app/(marketing)`) share the ERP tokens (`app/globals.css`) but have their own voice: an editorial
the same font as the ERP (Inter, the default; no serif or mono), larger titles, uppercase labels, square buttons and orange as an accent. They use the orange
accent: the layout wrapper has the `theme-public` class (end of `app/globals.css`), which fixes only the orange accent, the Inter font and
the error red for the public subtree, so the user's saved ERP accent and font (`data-accent`, `data-font` on `<html>`) never
leak in and nothing switches after hydration. **The mode is shared with the ERP:** surfaces and ink follow `data-mode` on `<html>`
(light, dark or system, the same cookie `ui_mode` and the same variables as the ERP; there is no second dark theme). The header's `ModeToggle`
(`components/ModeToggle.tsx`) switches it and the ERP opens in the same mode. Canvases that read colors from tokens at mount re-read them on a mode change
(`subscribeMode` in `lib/mode.ts`).

## Type

| Use | Class | Notes |
|---|---|---|
| Page title (hero, `PageIntro`) | `font-display text-hero` | Inter, weight 500 (the home hero adds `font-bold`, like the login title), `clamp(2.5rem, 5vw, 4.25rem)` |
| Section title | `font-display text-section` | `clamp(2rem, 3.4vw, 2.75rem)` |
| Item title (lists, steps) | `font-display text-title font-normal` | |
| Body and leads | `text-body text-ink-soft` | Inter, as in the ERP |
| Labels: nav, buttons, eyebrows, numbers | `text-label` | Inter 500, 11px, uppercase, `0.08em` tracking |

`font-display` (now just Inter, kept as a name for the big titles), `text-hero`, `text-section`, `text-label` and `rounded-sharp` are defined in section 5 of `app/globals.css`.

## Color

- Background `bg-canvas`; text `text-ink`, secondary `text-ink-soft`, faint `text-ink-faint`.
- **Orange (`brand`) is an accent only:** eyebrows (`text-label text-brand`), list numbers, the skyline illustration,
  progress lines, the METRI logo in the header (`components/MetriLogo.tsx`, from `public/LOGO_METRI_TEXT.svg`: orange house + the name in the text color, or all in the text color with `mono` (unused for now); the header
  serves the landing and the login; `Brand` uses it too, and its compact form is the house alone, `HouseLogo`). Never a button fill, never a full title.
- Inverted band: `bg-ink text-ink-foreground` (the footer, which also carries the `#contato` anchor), with secondary text at `text-ink-foreground/65`.
- The skyline's tones and the login logo's come from the same ramp, `brandRamp` in `lib/brand-ramp.ts`: change it there, not in each canvas.
- Read colors from tokens, including in `<canvas>` (`getComputedStyle(...).getPropertyValue("--color-brand")`).

## Components

- **Buttons:** always `MarketingButton` (`_components/MarketingButton.tsx`): square (`rounded-sharp`), `h-9`, label
  type. Variants `primary` (ink) and `outline` on light; `inverse` and `inverse-outline` on the dark band.
- **Section:** `Section` (eyebrow + large title) and `PageIntro` for inner pages.
- **Home order:** hero (a single centered title phrase, "Condomínio em dia.", very large bold Inter on one line (keep it to about 21 characters so it fits at every width, 360px phones included), rising from a mask; a brief description below and, under it, the single call to action "Agendar demonstração". The header holds the name "METRI" on the left, the nav and "Entrar";
  skyline below: the illustrated, interactive canvas `hero/ScanlineSkyline.tsx` (tall at the sides, low in the middle, windows lighting by themselves and under the mouse). A photo-to-scanlines version was tried and dropped: it looked too realistic for the site) → `Summary` (a formal text on what the system is, laid out like a book page: one narrow centered column where every paragraph is identical (same size and weight), justified and hyphenated; text from `SUMMARY` in `content.ts`; no eyebrow, badges, numbers or emphasis. It enters by time, not by scroll: a thin rule draws across the top, then the paragraphs rise one by one) → `GlobeSection` (no eyebrow: left: a large bold title that enters word by word (`WordsReveal`) and a short description (19px); right: the stage
  `globe/GlobeStage.tsx`: a 3D map of Brazil only, in the same orange scanlines as the skyline. The country (a 0.1° mask in
  `globe/brazil-mask.ts`, Natural Earth, public domain) is a patch of a large sphere, so the curvature gives the light
  relief (six ramp tones), layered offset copies make it look like a slab, and a slow ±5° sway shows the edges moving. It builds
  itself when the stage reaches the screen: rows appear from the bottom up, each traced left to right (~2 s), then the slab
  slides out from behind. After that at most two condominiums (`globe/locations.ts`, illustrative Brazilian cities) are on
  screen at once, one per side: the marker appears, a card (`LocationCard`: illustrative Unsplash photo seen through the
  scanlines, city and state; photos in `public/marketing/condominios`) wipes in tied to it by a line, stays ~5.5 s, then
  marker, card and line go away and the next city takes its place (the second slot starts ~1.4 s after the first); copy
  in `GLOBE` in `content.ts`; with reduced motion it shows two fixed markers) → `Questions` (a full-bleed dark band: `bg-ink text-ink-foreground`, like the footer, so the cards invert inside it (open = `bg-ink-foreground text-ink`); seven flat cards of different sizes on a 4-column grid, `A A B C / A A D C / E F F G`, rows of fixed height so a click never moves the neighbors; each title is a question and a click opens the answer inside the card, which turns ink; the first starts open; under `lg` they stack; copy in `QUESTIONS` in `content.ts`, answers must stay short to fit the card's size) → `ScreenStack` (no eyebrow or small title: one real screen of the system at a time, `public/marketing/painel.png` and `unidades.png` (1440×900 at 2x, light theme, fictitious `seed_demo` data only), about 550px wide on the left in a rounded frame, with two text labels under it ("Painel", "Unidades") that cross-fade between the screens; on the right only the text of the current screen, with no tabs, hairlines or columns: one sentence and the three points (`point.term` label + short text), from `SCREENS` in `content.ts`: state only what the print shows; the screen rises when the section enters; under `lg` the image goes on top of the text; if a print is retaken keep the size and re-check the text against it) → a closing skyline (`ScanlineSkyline variant="footer"` at the end of the home only: same orange scanline buildings and lit windows as the hero but another silhouette, a hill (tall in the middle, low at the ends; `shape: "hill"` in `skyline-scene.ts`), seated on the footer's top edge to close the cycle; the buildings rise when it scrolls into view, not on load; the `-mb-12` cancels the footer's `mt-12`) → the footer (`SiteFooter`, shared by all public pages and the only closing block: there is no separate contact band; a full-bleed `bg-ink` footer with `id="contato"`, the brand, a one-line description, the "Agendar demonstração"/"Entrar" buttons and three link columns: site, modules (from `FEATURES`) and access; a hairline and the copyright below; only real routes and facts, no invented address, phone or social links). Each section must be understood at a glance.
- **Login to panel transition:** on a successful login `LoginForm` calls `startLoginTransition()` (`lib/login-transition.ts`) and `components/LoginTransition.tsx`, mounted in the root layout so it survives the page change,
  covers the screen (`bg-canvas`) with the house logo building itself bottom-up in 16 horizontal bands that slide in from the left, then breathing slowly. It leaves in a fade when the
  path is no longer `/login` and at least 1.7 s have passed (10 s at most). With reduced motion the logo shows whole and still.
- **Sky flyers:** `hero/SkyFlyers.tsx` sends a plane (with a fading contrail) or a V-shaped flock of birds across the hero sky above the title every 6–13 s, drawn as the same orange scanlines (sprites are rows of segments on the 4px grid). It only draws while something is in the air, never when the tab is hidden or the hero is covered, and not at all for `prefers-reduced-motion`.
- **Hero to Summary transition (curtain):** the hero is `sticky top-0 h-svh` and everything after it lives in a
  `relative z-10 bg-canvas` wrapper in `page.tsx`, so the next section slides over the pinned hero and covers the
  buildings; the hero text fades out over the first 350px. No melt, no extra canvas. Keep the wrapper opaque.
- **Lists instead of cards:** items are flat, separated by a hairline (`border-ink/10`–`/15`). Unlike the ERP, thin
  rules are allowed here. No glow, spotlight or gradient cards.
- **Motion:** `Reveal` on enter; Lenis smooth scroll; scroll-linked motion (the hero text fade) via
  `useScroll` + `useTransform`; the hero skyline is the only continuous animation. Everything
  stops for `prefers-reduced-motion`.
- **Canvas performance:** draw static parts once per size into offscreen canvases (`hero/skyline-layers.ts`) and only
  composite per frame at the display rate (no fps cap: throttling looks choppy on 120 Hz screens); cap the pixel ratio
  (1.5); start loops after idle; pause when off-screen or once the next section has covered the hero.
  Per frame, do only what changes: the skyline paints lit windows straight on the grid (two 3px bars each) once the
  buildings have risen, instead of a full-canvas `destination-out` pass, and skips all updates while hidden; the globe
  paints the map into an offscreen layer and re-paints it only when the sway crosses a mask step (0.1°), otherwise it
  just blits it. No `backdrop-filter` over the animated hero (the scrolled header is `bg-canvas/95`).

## Don't

Pill buttons, `glass` panels, emoji or icon grids, invented metrics, gradient backgrounds, more than one orange
element competing in the same view.
