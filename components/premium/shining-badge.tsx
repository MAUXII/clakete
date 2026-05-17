import { cn } from "@/lib/utils"
import { SHINING_PRODUCT_NAME } from "@/lib/plans"

export function ShiningBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#C9A227]/35 bg-[#9B2335]/20 px-2.5 py-0.5",
        "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f0d4a8]",
        className,
      )}
    >
      {SHINING_PRODUCT_NAME}
    </span>
  )
}
