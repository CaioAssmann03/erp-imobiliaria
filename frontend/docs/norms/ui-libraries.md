---
read-when: you use Tailwind, shadcn/Base UI, icons, toasts or charts
size: small
---
# UI libraries (N — Norms)

| Library | Use | Rule |
|---|---|---|
| Tailwind v4 | styling | token utilities only; mobile first (`sm:`/`md:`/`lg:`); never build class names dynamically (`bg-${x}` is purged); custom utilities via `@utility` in `globals.css` |
| shadcn/ui on Base UI | `components/ui/`, dialogs, menus | treat as vendored; wrap instead of editing (`LinkButton`, `ConfirmDeleteButton`); overlays trap focus, close on `Esc`/outside click, need a title (`sr-only` if hidden) |
| `lucide-react` | icons | named imports; icon-only buttons need `aria-label` |
| `sonner` | toasts | one `<Toaster/>` in `app/layout.tsx`; short non-technical Portuguese; one toast per user action, none for background refetches |
| `recharts` | charts | inside small client components (`SimpleBarChart`), plain data props, nearby text summary; heavy screens: `next/dynamic` with `ssr:false` + skeleton |
| `cva`, `clsx`, `tailwind-merge` | variants/classes | use `cn()` from `lib/utils.ts` |
| `tw-animate-css` | enter/exit animation | utilities like `animate-in fade-in-0` |
| `next-themes` | only the shadcn `sonner` wrapper | the app theme is cookie-driven (norms/design-system.md); do not use it for the theme |
