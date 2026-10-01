import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-control bg-surface-muted px-3.5 text-body text-ink transition-colors outline-none placeholder:text-ink-faint focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-danger/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
