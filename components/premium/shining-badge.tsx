import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { SHINING_PRODUCT_NAME } from "@/lib/plans"

export function ShiningBadge({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md"
}) {
  const iconClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"

  return (
    <span
      title={SHINING_PRODUCT_NAME}
      aria-label={SHINING_PRODUCT_NAME}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        "text-[color:var(--profile-badge,#C9A227)]",
        className,
      )}
    >
      <Sparkles className={iconClass} strokeWidth={1.75} aria-hidden />
    </span>
  )
}
