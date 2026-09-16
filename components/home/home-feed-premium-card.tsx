"use client"

import Link from "next/link"
import { useT } from "@/components/providers/i18n-provider"
import { hasShiningAccess } from "@/lib/plans"
import { useProfile } from "@/components/providers/profile-provider"
import { useDesignMode } from "@/hooks/use-design-mode"
import { glassSurface } from "@/lib/glass-surface"
import { cn } from "@/lib/utils"

/** Compact Shining upsell for the home feed right rail (X-style Premium card). */
export function HomeFeedPremiumCard() {
  const { t } = useT()
  const { profile } = useProfile()
  const gs = glassSurface(useDesignMode() === "glass")

  if (
    hasShiningAccess({
      plan: profile?.plan,
      plan_status: profile?.plan_status,
      plan_current_period_end: profile?.plan_current_period_end,
    })
  ) {
    return null
  }

  return (
    <section className={cn("p-4", gs.railCard)}>
      <h2 className={cn("text-[15px] font-bold tracking-tight", gs.fg)}>
        {t("home.premiumCardTitle")}
      </h2>
      <p className={cn("mt-1.5 text-[13px] leading-snug", gs.body)}>
        {t("home.premiumCardBody")}
      </p>
      <Link
        href="/price"
        className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {t("home.premiumCardCta")}
      </Link>
    </section>
  )
}
