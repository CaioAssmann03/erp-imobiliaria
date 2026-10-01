import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full text-body font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-danger/30 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ink text-ink-foreground hover:bg-ink/85",
        brand: "bg-brand text-brand-foreground hover:bg-brand-strong",
        secondary: "bg-surface-muted text-ink hover:bg-surface-sunken",
        ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
        destructive: "bg-danger-soft text-danger hover:bg-danger/15",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-2 px-4",
        sm: "h-7 gap-1.5 px-3 text-caption",
        lg: "h-10 gap-2 px-5",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
