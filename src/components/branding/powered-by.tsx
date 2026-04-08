import { cn } from "@/lib/utils"
import { PLATFORM_BRAND_NAME } from "@/lib/branding"

interface PoweredByProps {
  className?: string
}

export function PoweredBy({ className }: PoweredByProps) {
  return (
    <p className={cn("text-xs text-gf-muted/70", className)}>
      Powered by {PLATFORM_BRAND_NAME}
    </p>
  )
}
