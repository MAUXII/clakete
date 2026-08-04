"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, X } from "lucide-react"
import { useProfile } from "@/components/providers/profile-provider"
import { useT } from "@/components/providers/i18n-provider"
import {
  hasShiningAccess,
  SHINING_MONTHLY_PRICE_LABEL,
  SHINING_PRODUCT_NAME,
  SHINING_TRIAL_DAYS,
} from "@/lib/plans"
import { cn } from "@/lib/utils"

/** Bump when promo copy changes so dismissed users see it again. */
const STORAGE_KEY = "clakete.promo-banner.dismissed.v2"
/** Keep in sync with banner height (h-9). */
export const PROMO_BANNER_HEIGHT = "2.25rem"

function setPromoHeightVar(on: boolean) {
  if (typeof document === "undefined") return
  document.documentElement.style.setProperty(
    "--clakete-promo-h",
    on ? PROMO_BANNER_HEIGHT : "0px",
  )
  if (on) document.documentElement.dataset.promoBanner = "1"
  else delete document.documentElement.dataset.promoBanner
}

export function PromoTopBanner() {
  const { t } = useT()
  const { profile, loading: profileLoading } = useProfile()
  const [visible, setVisible] = useState(false)

  const shining = hasShiningAccess({
    plan: profile?.plan,
    plan_status: profile?.plan_status,
    plan_current_period_end: profile?.plan_current_period_end,
  })

  useEffect(() => {
    // Wait for profile so we don't flash then hide for Shining users.
    if (profileLoading) return

    if (shining) {
      setVisible(false)
      setPromoHeightVar(false)
      return
    }

    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setVisible(false)
        setPromoHeightVar(false)
        return
      }
    } catch {
      /* ignore */
    }

    setVisible(true)
    setPromoHeightVar(true)
  }, [shining, profileLoading])

  useEffect(() => {
    return () => setPromoHeightVar(false)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    setVisible(false)
    setPromoHeightVar(false)
  }

  if (!visible) return null

  const href = "/price"

  return (
    <div
      className={cn(
        "pointer-events-auto relative z-10 w-full shrink-0",
        "bg-brand text-white",
        "border-b border-white/10",
      )}
      role="region"
      aria-label={t("promo.bannerAria")}
    >
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-center gap-3 px-10 sm:px-12">
        <p className="flex min-w-0 items-center justify-center gap-1.5 truncate text-center text-[12px] font-medium sm:text-[13px]">
          <Sparkles className="size-3.5 shrink-0 opacity-90" aria-hidden />
          <span className="truncate">
            <span className="font-semibold">{SHINING_PRODUCT_NAME}</span>
            {" → "}
            {t("promo.bannerText", {
              price: SHINING_MONTHLY_PRICE_LABEL,
              days: SHINING_TRIAL_DAYS,
            })}
          </span>
          <Link
            href={href}
            className="ml-1 inline-flex shrink-0 items-center gap-1 underline underline-offset-2 transition hover:text-white/90"
          >
            {t("promo.bannerCta")}
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("common.close")}
        className={cn(
          "absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md",
          "text-white/80 transition hover:bg-white/10 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        )}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
