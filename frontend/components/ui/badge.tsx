import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-caption font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-ink text-ink-foreground",
        secondary: "bg-surface-sunken text-ink ring-1 ring-inset ring-ink/15",
        brand: "bg-[color-mix(in_oklab,var(--color-brand)_20%,var(--color-surface))] text-brand-strong ring-1 ring-inset ring-brand/40",
        success:
          "bg-[color-mix(in_oklab,var(--color-success)_20%,var(--color-surface))] text-[color-mix(in_oklab,var(--color-success)_80%,var(--color-ink))] ring-1 ring-inset ring-success/40",
        danger:
          "bg-[color-mix(in_oklab,var(--color-danger)_18%,var(--color-surface))] text-[color-mix(in_oklab,var(--color-danger)_85%,var(--color-ink))] ring-1 ring-inset ring-danger/40",
        warning:
          "bg-[color-mix(in_oklab,var(--color-warning)_24%,var(--color-surface))] text-[color-mix(in_oklab,var(--color-warning)_60%,var(--color-ink))] ring-1 ring-inset ring-warning/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
