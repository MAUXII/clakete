import { cn } from "@/lib/utils"
import { SHINING_PRODUCT_NAME } from "@/lib/plans"

/** Compact premium mark — REDRUM nod to The Shining. */
export function ShiningBadge({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md"
}) {
  return (
    <span
      title={SHINING_PRODUCT_NAME}
      aria-label={SHINING_PRODUCT_NAME}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm",
        "bg-brand font-semibold uppercase tracking-[0.14em] text-white",
        size === "sm"
          ? "px-1 py-px text-[8px] leading-none"
          : "px-1.5 py-0.5 text-[9px] leading-none",
        className,
      )}
    >
      REDRUM
    </span>
  )
}
