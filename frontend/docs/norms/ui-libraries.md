---
summary: Rules for Tailwind, shadcn/Base UI, lucide, sonner and recharts.
read-when: you use one of those libraries
skip-if: tokens and theme → norms/design-system.md
---
# UI libraries (N — Norms)

| Library | Use | Rule |
|---|---|---|
| Tailwind v4 | styling | token utilities only; mobile first (`sm:`/`md:`/`lg:`); never build class names dynamically (`bg-${x}` is purged); custom utilities via `@utility` in `globals.css` |
| shadcn/ui on Base UI | `components/ui/`, dialogs, menus | treat as vendored; wrap instead of editing (`LinkButton`, `ConfirmDeleteButton`); overlays trap focus, close on `Esc`/outside click, need a title (`sr-only` if hidden) |
| `lucide-react` | icons | named imports; icon-only buttons need `aria-label` |
| `sonner` | toasts | one `<Toaster/>` in `app/layout.tsx`; **import `toast` from `@/lib/toast`, never from `sonner`**; short non-technical Portuguese; one toast per user action, none for background refetches. Toasts use the colors opposite to the mode (`ink` on `ink-foreground`: dark in light mode, light in dark mode). `toast.error` is our own `ErrorToast`: when its message just came from `applyServerErrors` / `apiErrorMessage`, a click opens what the API answered (status, request, and each error's field, code and server message; `lib/error-details.ts`); with no API error it is just the message |
| `recharts` | charts | inside small client components (`SimpleBarChart`), plain data props, nearby text summary; heavy screens: `next/dynamic` with `ssr:false` + skeleton |
| `cva`, `clsx`, `tailwind-merge` | variants/classes | use `cn()` from `lib/utils.ts` |
| `tw-animate-css` | enter/exit animation | utilities like `animate-in fade-in-0` |
| `next-themes` | only the shadcn `sonner` wrapper | the app theme is cookie-driven (norms/design-system.md); do not use it for the theme |
| `motion`, `lenis` | public marketing pages only (`app/(marketing)`) | never in the ERP shell; respect `prefers-reduced-motion` (Lenis is skipped); import from `motion/react` |
