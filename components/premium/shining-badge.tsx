import { cn } from "@/lib/utils"
import { SHINING_PRODUCT_NAME } from "@/lib/plans"

export function ShiningBadge({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#C9A227]/35 bg-[#9B2335]/20 font-semibold uppercase tracking-[0.14em] text-[#f0d4a8]",
        size === "sm"
          ? "px-1.5 py-px text-[8px] tracking-[0.12em]"
          : "px-2.5 py-0.5 text-[10px]",
        className,
      )}
    >
      {size === "sm" ? "Shining" : SHINING_PRODUCT_NAME}
    </span>
  )
}
