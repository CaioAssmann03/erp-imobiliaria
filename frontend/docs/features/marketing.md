---
summary: Design rules of the public pages (landing, features, module pages, how-it-works, contato): voice, type, color, components, page structure, motion/canvas rules, and how to add a page or a module.
read-when: you touch anything under app/(marketing), the public header/footer, or the login transition
skip-if: the logged-in ERP → conventions/design-system.md; SEO/metadata rules → quality/accessibility-and-seo.md; routes → structure/routes.md
---
# Public pages

The public pages (`app/(marketing)`) share the ERP tokens (`app/globals.css`) but have their own voice: editorial, Inter only (no serif or mono), larger titles, uppercase labels, square buttons and the orange accent. The layout wrapper has the `theme-public` class (end of `globals.css`), which fixes only the orange accent, the Inter font and the error red for that subtree, so the user's saved ERP accent and font never leak in. **The mode is shared with the ERP:** surfaces and ink follow `data-mode` on `<html>` (cookie `ui_mode`; no second dark theme); the header's `ModeToggle` switches it, and canvases that read colors from tokens re-read them on a mode change (`subscribeMode`, `lib/theme/mode.ts`).

The pages are **server components by default**; only the animated or interactive pieces are small client components (the story pages `CondominiumStory`, `LancamentosStory`, `CobrancasStory` are server components).

## Type and color

| Use | Class |
|---|---|
| Page title (hero, `PageIntro`) | `font-display text-hero` (Inter 500; the home hero adds `font-bold`) |
| Section title | `font-display text-section` |
| Item title | `font-display text-title font-normal` |
| Body and leads | `text-body text-ink-soft` |
| Labels: nav, buttons, eyebrows | `text-label` (Inter 500, 11px, uppercase) |

`font-display`, `text-hero`, `text-section`, `text-label` and `rounded-sharp` are defined in `globals.css` (section 5).

- Background `bg-canvas`; text `text-ink`, `text-ink-soft`, `text-ink-faint`.
- **Orange (`brand`) is an accent only**: eyebrows, list numbers, the skyline/map illustrations, progress lines, the METRI logo (`components/brand/MetriLogo.tsx`; `HouseLogo` is the house alone). Never a button fill, never a full title; no more than one orange element competing in a view.
- The footer is `band bg-band text-ink-foreground` (the `.band` class flips ink inside it in dark mode); secondary text `text-ink-foreground/65`.
- Illustration tones come from one ramp, `brandRamp` (`lib/theme/brand-ramp.ts`): change it there. Read colors from tokens, including in `<canvas>` (`getComputedStyle(...).getPropertyValue("--color-brand")`).
- **The signature effect** is orange horizontal scanlines (3 px of color, 1 px clear): the skyline, the map, photos seen through a "blind", the contact icons. New illustrations reuse it.
- Lists, not cards: flat items separated by a hairline (`border-ink/10`–`/15`; thin rules are allowed here, unlike the ERP). No glow, spotlight or gradient cards.

## Components

- **Buttons:** always `MarketingButton` (`_components/MarketingButton.tsx`): square, `h-9`, label type. Variants `primary` (ink) and `outline` on light; `inverse` and `inverse-outline` on the dark band.
- **Section** (eyebrow + large title) and `PageIntro` for inner pages. `Reveal` for enter animations.
- **Header** (`SiteHeader`): "METRI" on the left, the nav and "Entrar". *Recursos* links to `/features` and opens, on hover or focus (CSS only), a square panel listing `MODULE_LINKS` (name + `summary`) and "Todos os recursos"; it stays in ink on any `/features/...` page. The nav is hidden under `md`; there, a menu button sits left of the logo and opens the **side menu** (`layout/MobileNav.tsx`): a clean panel from the left (links Início, Recursos with the module names under it, Como funciona, Contato; "Agendar demonstração" and "Entrar" at the bottom; no hairlines, summaries or decoration). It closes with the X, Esc, a tap outside, a route change or growing to `md`; while open the page behind is frozen (`overflow: hidden` on `<html>`), focus is trapped and returns to the button. In lite mode it appears without sliding.
- **Footer** (`SiteFooter`, shared by all public pages, the only closing block): brand, one-line description, "Agendar demonstração"/"Entrar" and three link columns (site, modules from `MODULE_LINKS`, the same four as the Recursos submenu, each linking to its own page, access). Only real routes and facts: no invented address, phone or social links.
- **`ThemedImage`:** every screenshot exists as a light and a dark image (`*-dark.png`, 1440×900 @2x, fictitious `seed_demo` data); the component renders both with `.print-light` / `.print-dark` and CSS shows the one of the current mode (`system` follows the OS). Only the light one carries the `alt`. To retake: the same screens with the `ui_mode` cookie set to `dark`.
- **Login → panel transition:** on a successful login `LoginForm` calls `startLoginTransition()` (`lib/auth/login-transition.ts`) and `components/LoginTransition.tsx` (mounted in the root layout) covers the screen with the house logo building itself, leaving in a fade once the path is no longer `/login` (min 1.7 s, max 10 s). With reduced motion the logo shows whole.

## The pages

Copy lives in `_components/content.ts` (`SUMMARY`, `GLOBE`, `QUESTIONS`, `SCREENS`, `MODULES`, `MODULE_PAGES`, `HOW_IT_WORKS`…). **State only what the system does today, with no invented figures**; check `overview.md` and `domain-model.md` before writing a claim, and re-check a text when its screenshot is retaken.

### Home (`/`), in order

1. **Hero**, in two compositions picked by CSS (`hero/Hero.tsx` renders both as sibling `section`s, never inside a wrapper, so the `sticky` curtain keeps working; copy shared in `hero/hero-copy.ts`). **Phone (under `md`, `hero/HeroMobile.tsx`)**: a column, text on top and the skyline in its own strip below, so buildings never cross the text. Left-aligned bold title in two lines ("Condomínio" / "em dia.", each rising from a mask), the description, two buttons (Agendar demonstração, Recursos), the four module links under a hairline (hidden on screens under 700 px tall), and a skyline strip of `clamp(10rem, 36svh, 20rem)` with the planes and birds behind it. No eyebrow and no stripes under the header. There is no mouse, so a touch lights the windows around the finger (the light shrinks away when the finger leaves) and the parallax follows the scroll (`ScanlineSkyline`: `pointer: coarse`). **Desktop (`md` up, `hero/HeroDesktop.tsx`)**: a single centered bold title ("Condomínio em dia.", about 21 characters so it fits at 360 px), a short description and one call to action ("Agendar demonstração"), over the orange scanline skyline canvas (`hero/ScanlineSkyline.tsx`, windows lighting by themselves and under the mouse; a hidden hero has a zero-size canvas, which the skyline skips). `hero/SkyFlyers.tsx` sends a plane or a flock across the sky. The hero is `sticky top-0 h-svh` and everything after it lives in a `relative z-10 bg-canvas` wrapper in `page.tsx`, so the next section slides over it like a curtain; keep that wrapper opaque.
2. **`Summary`**: a formal text on what the system is, laid out like a book page (one narrow centered column, identical justified, hyphenated paragraphs; no eyebrow, badges or emphasis). It enters by time, not by scroll.
3. **`GlobeSection`**: a large title that enters word by word and, on the right, `globe/GlobeStage.tsx`, a 3D map of Brazil in the scanlines (mask in `globe/brazil-mask.ts`, Natural Earth). At most two illustrative condominium cards (`globe/locations.ts`, photos in `public/marketing/condominios`) are on screen at once. With reduced motion: two fixed markers.
4. **`Questions`**: a full-bleed dark band (`bg-ink`), seven flat cards on a 4-column grid; a click opens the answer inside the card (the first starts open). Answers must stay short.
5. **`ScreenStack`**: three real screens, one per module (`unidades`, `lancamentos`, `cobrancas`), in a **single plain row**: the one under the mouse, with focus, or tapped opens (`grow-[8]`, 0.5 s `flex-grow`) and the others become narrow strips with a vertical title. A screen never rescales while opening (each button holds the print at the row's full height, left-aligned; the row ratio `aspect-[1104/540]` makes the open screen exactly 1440/900: recompute it if the column width or the grow ratio changes). The title and one-line lead of the open screen sit under the row. Under `lg` the prints stack, one per block with its title and lead; on a phone each print is 44 rem wide inside a window that pans sideways only (the vertical gesture still scrolls the page; a hint says "Arraste para ver a tela inteira"), because a print scaled to 342 px is unreadable. Plain prints, not an "experience": no tour, zoom, pinned stage or deck.
6. A short invitation ("Conhecer os recursos" → `/features`), a closing skyline (`ScanlineSkyline variant="footer"`, a hill silhouette seated on the footer's top edge), then the footer.

### `/features`

Opens with `AcronymReveal` (METRI as five stacked pills in a zigzag, joined by bars; the page `h1` is screen-reader only; data in `ACRONYM`), then one `ModuleSection` per module (`MODULES`): a hairline, the module's picture on the left (above the text on a phone) and a name plus two or three justified paragraphs. The picture is passed as `children` and is never a building (the skyline is the hero). `placement` is `left`, `right` or `below`. Current ones: **Condomínios** (`visuals/CondominiumPlan.tsx`, the condominium → blocks → units hierarchy), **Lançamentos** (text only, or the `EntryChart` line chart), **Cobranças** (`visuals/BillingFlow.tsx`, one huge 3D "100%" counting up once). **Assistente** (`visuals/AssistantChat.tsx` + `components/brand/AssistantMascot.tsx`, `placement="below"`: a mascot (`public/brand/ai_logo.svg`, the house with wide-open eyes, inlined in parts and in the brand orange: it rises and fades in once when it enters the screen, floats, blinks with an eyelid whose height animates, and the pupils follow the mouse through a spring, each centered in its own eye and moving the same distance in every direction (`components/brand/AssistantMascot.tsx`: `LEFT_CENTERING`, `RIGHT_CENTERING`, `TRAVEL`, measured on the drawing); its legs, the third bar and the feet, come down from under the body only after the click) beside a speech bubble that invites the click; it hops by itself now and then (every 4 to 8 s, sometimes twice, only while on screen and before the click); the click makes it squash and hop and the bubble becomes an illustrative chat that plays once (a question typed letter by letter while it looks at the bubble, a scanline "thinking" bar while the pupils sweep side to side looking up, an answer while the three body bars fade in a wave, then a question about registered data whose answer shows the limit). In the lite mode it is still, open and whole from the start. The help chat explains the system and never reads or changes registered data). Each module section with a `slug` ends with an outline "Saber mais" button to its page.

### Module pages (`/features/[slug]`)

`generateStaticParams` from `MODULE_SLUGS`, `dynamicParams = false`, metadata from the lead. Each module has its **own landing idea** (never copy another's), all the same mold: an ordinary scrolling page read as one text, with `story/StoryTitle.tsx` (the module name, enormous, each letter rising from a mask), the lead in ink, one centered `max-w-2xl` column of large justified text with small left subheads, illustrations **between paragraphs or beside the text, never over it**, and `ModuleOutro` at the end (a hairline and one row: "Próximo", the next page's name and summary, an arrow; sequence Condomínios → Lançamentos → Cobranças → Assistente → Como funciona; static, no JS).

- **Condomínios** (`CondominiumStory`): scanline-blind photos beside the text (`StoryPhoto`, from `public/marketing/condominios`; a full-width strip under 640 px, with the blind curtain and the image drifting slowly inside its frame while scrolling; floated from `sm` to `xl`; in the margin with a slight drift from `xl`), and at the end `ScreenCollage`: two real overlapped screens drifting at different speeds; a click opens a `Lightbox` (portaled `theme-public` overlay, closes with Esc or click).
- **Lançamentos** (`LancamentosStory`): no screenshots; elements between paragraphs, all in orange scanlines (`story/Orange3D.tsx`): `ScanPhoto` (a work in progress, tinted orange in the file), `IsoBars` (eight CSS 3D columns) and `EntryChart`.
- **Assistente** (`AssistenteStory`): same mold, text only plus our assistant right after the lead (`visuals/AssistantMascotAlone`: the mascot with its speech bubble; the click opens no chat, it hops, its legs come down or go away (two clicks each) and the eyes react, one reaction per click in order: rolling the eyes, looking around, "no", "yes"; outside a reaction the eyes follow the mouse and it hops by itself now and then; the click-to-start chat stays only in the Recursos section). Along the text, three AI drawings in the orange scanline effect (`visuals/AssistenteVisuals.tsx`, placed by `DECORATIONS` in `AssistenteStory`): `NeuralNet` (a layered network with a signal running layer to layer), `QuestionFilter` (the chat's personal-data filter: a question field where a question with a made-up CPF is typed, a scanline sweep marks the data, the send button locks and the refusal shows with the system's real message (`assistant_question.question.sensitive_data`); then the data is erased, a clean question is typed, the sweep finds nothing and the send button unlocks) and `VoiceWave` (bars rising and falling in a wave). Each enters once on view, loops softly, and is still in the lite mode. No topic lists or scroll-driven effects (the running mascot, the topic blocks, the chat-like "question and answer" drawing and a generic barrier were tried and dropped). The copy must keep saying it explains the system, does not search or change registers, refuses personal data and runs only for logged-in users (`features/assistant.md`).
- **Cobranças** (`CobrancasStory`): a discreet `ScanBand`, `RealBoleto` (a public-domain example boleto rising to face front) and a `ScanPhoto` of money. Photos must be about the page's subject (work, money, bills), not buildings.

### `/how-it-works`

`sections/HowItWorks.tsx`, content in `HOW_IT_WORKS` and `HOW_IT_WORKS_INTRO`: the `h1` (two lines rising from a mask), a hairline, a lead and four justified paragraphs, then a row of **buildings in steps** (Cadastro, Plano de cobrança, Lançamentos, Emissão do mês, Pagamento e conciliação), black and white (faces `bg-canvas` with a 2 px ink top line, sides `bg-ink` as a `clip-path`), each in front of the previous, alternating sides, the last bleeding into the footer. Positions are in `BUILDINGS` (in `cqw` from `lg`, stacked at a fixed step below). The only orange is a band of four scanlines under the title; **no orange on the buildings**. Each building rises when its `li` reaches 25 % from the bottom (`useInView` on the `li`, not on the moving block). Each building's text is information not elsewhere on the site (keyword `h2` + a short paragraph of real facts); check `MODULES`/`MODULE_PAGES` so it does not repeat them.

### `/contato`

Only the `h1` and two square cards, *Enviar mensagem* (opens a form below) and *WhatsApp*, each icon drawn by `contato/ScanGlyph.tsx` in the map's scanline effect. **Visual only:** the form does not send and the WhatsApp card has no link yet (`whatsappHref`/`mailtoHref` and `NEXT_PUBLIC_CONTACT_*` in `lib/site/site.ts` are ready).

## Phones

Everything public must work at 360–430 px with no horizontal scroll. Long text (`Summary`, `ModuleSection`, the module stories, `HowItWorks`) is **left-aligned and not hyphenated under `sm`** and justified/hyphenated from `sm` (justified text in a 340 px column opens rivers). Closed `Questions` cards have no minimum height under `sm` (only the title), the `HowItWorks` title is larger and wraps in more lines under `sm`, and side gutters are `px-5` there. Touch has no hover: anything that reacts to the mouse needs a touch or scroll equivalent (the skyline above). Verify a change by looking at it at 390 px in both modes.

## Motion, canvas and the lite mode

- Motion: `Reveal` on enter; Lenis smooth scroll (`SmoothScroll` sends the page to the top when the pathname changes and observes `body` with a `ResizeObserver` to call `lenis.resize()`, because Lenis only watches `html`); scroll-linked motion with `useScroll` + `useTransform`. The hero skyline is the only continuous animation.
- **Everything stops in the lite mode** (`isLite()` / `useLite()`, which includes `prefers-reduced-motion`; see `conventions/design-system.md`). Each animation keeps a still branch, and a new one must honor the mode; never `useReducedMotion` on its own.
- Canvas performance: draw static parts once per size into offscreen canvases (`hero/skyline-layers.ts`) and only composite per frame at the display rate (no fps cap); cap the pixel ratio (1.5); start loops after idle; pause when off-screen or once the next section covers the hero; per frame, do only what changes (the globe re-paints its map only when the sway crosses a mask step). No `backdrop-filter` over the animated hero.

## Add a public page

Add the route under `app/(marketing)/`, export `metadata = pageMetadata({ title, description, path })` (`lib/site/page-metadata.ts`: canonical, Open Graph and Twitter in one) and add its path to `PUBLIC_PAGES` in `lib/site/public-pages.ts`: that single list feeds the sitemap and lets `proxy.ts` open the page without a login. Structured data goes in `<JsonLd>` and states only what the site already says.

## Add a module

A slug in `MODULE_SLUGS` (it enters the sitemap and public paths by itself), an entry in `MODULES` (with `slug` and a one-line `summary`), one in `MODULE_PAGES`, and its story component; the header submenu and the "Saber mais" rows follow.

## Don't

Pill buttons, `glass` panels, emoji or icon grids, invented metrics, gradient backgrounds, an orange hover or orange on the black-and-white buildings.
