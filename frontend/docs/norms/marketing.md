---
summary: Design system of the public pages (landing, features, how-it-works): type, colors, buttons, layout.
read-when: you touch anything under app/(marketing)
skip-if: the logged-in ERP → norms/design-system.md; folders and routes → structure/folders-and-routes.md
---
# Public pages design system (N — Norms)

The public pages (`app/(marketing)`) share the ERP tokens (`app/globals.css`) but have their own voice: an editorial
serif for titles, mono uppercase labels, square buttons and orange as an accent. They are always light with the orange
accent: the layout wrapper has the `theme-public` class (end of `app/globals.css`), which redefines the light/orange
tokens for the public subtree, so the user's saved ERP theme (`data-mode`, `data-accent`, `data-font` on `<html>`) never
leaks in and nothing switches after hydration.

## Type

| Use | Class | Notes |
|---|---|---|
| Page title (hero, `PageIntro`) | `font-display text-hero` | Source Serif (preloaded by `app/(marketing)/fonts.ts`), weight 400, `clamp(2.5rem, 5vw, 4.25rem)` |
| Section title | `font-display text-section` | `clamp(2rem, 3.4vw, 2.75rem)` |
| Item title (lists, steps) | `font-display text-title font-normal` | |
| Body and leads | `text-body text-ink-soft` | Inter, as in the ERP |
| Labels: nav, buttons, eyebrows, numbers | `text-label` | IBM Plex Mono 11px, uppercase, `0.08em` tracking; font loaded in `app/(marketing)/fonts.ts` (`--font-label-mono`) |

`font-display`, `text-hero`, `text-section`, `text-label` and `rounded-sharp` are defined in section 5 of `app/globals.css`.

## Color

- Background `bg-canvas` (light grey); text `text-ink`, secondary `text-ink-soft`, faint `text-ink-faint`.
- **Orange (`brand`) is an accent only:** eyebrows (`text-label text-brand`), list numbers, the skyline illustration,
  progress lines. Never a button fill, never a full title.
- Dark band: `bg-ink text-ink-foreground` (the contact section), with secondary text at `text-ink-foreground/65`.
- Read colors from tokens, including in `<canvas>` (`getComputedStyle(...).getPropertyValue("--color-brand")`).

## Components

- **Buttons:** always `MarketingButton` (`_components/MarketingButton.tsx`): square (`rounded-sharp`), `h-9`, label
  type. Variants `primary` (ink) and `outline` on light; `inverse` and `inverse-outline` on the dark band.
- **Section:** `Section` (eyebrow + serif title) and `PageIntro` for inner pages.
- **Home order:** hero (no gradient fade: below the hero, a second canvas holds the skyline's base dripping in striped
  square pixels with the buildings' tones, `hero/skyline-drip.ts`; the melt starts only once the ground has left the
  screen and grows faster than the scroll; the title moves slower than the page and fades out) → `Statement` (text
  only, no prints, top padding (45svh) is the drip band:
  a serif paragraph from `STATEMENT` in `content.ts`, each sentence rising and fading in over its slice of the
  scroll) → `ProductTour`
  (the real dashboard print `public/marketing/painel.png`, sticky while the scroll moves a highlight over three areas,
  with one label and one short line per area; areas in `product-tour/tour-steps.ts`, re-check them if the print is
  retaken; the print uses fictitious data only) → modules → contact. Each section must be understood at a glance.
- **Lists instead of cards:** items are flat, separated by a hairline (`border-ink/10`–`/15`). Unlike the ERP, thin
  rules are allowed here. No glow, spotlight or gradient cards.
- **Motion:** `Reveal` on enter; Lenis smooth scroll; scroll-linked motion (hero title and drips, `Statement`) via
  `useScroll` + `useTransform`; the hero skyline is the only continuous animation. Everything
  stops for `prefers-reduced-motion`.
- **Canvas performance:** draw static parts once per size into offscreen canvases (`hero/skyline-layers.ts`) and only
  composite per frame at the display rate (no fps cap: throttling looks choppy on 120 Hz screens); cap the pixel ratio
  (1.5); start loops after idle; pause when off-screen. The drip is pre-rendered whole and revealed by copying one
  slice per column, redrawn only when the melt or parallax changes.

## Don't

Pill buttons, `glass` panels, emoji or icon grids, invented metrics, gradient backgrounds, more than one orange
element competing in the same view.
