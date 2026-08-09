"use client"

import Link from "next/link"
import { useT } from "@/components/providers/i18n-provider"
import { hasShiningAccess } from "@/lib/plans"
import { useProfile } from "@/components/providers/profile-provider"

/** Compact Shining upsell for the home feed right rail (X-style Premium card). */
export function HomeFeedPremiumCard() {
  const { t } = useT()
  const { profile } = useProfile()

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
    <section className="rounded-2xl border border-border bg-muted/40 p-4">
      <h2 className="text-[15px] font-bold tracking-tight text-foreground">
        {t("home.premiumCardTitle")}
      </h2>
      <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
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
