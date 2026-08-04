"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { useProfile } from "@/components/providers/profile-provider"
import { useT } from "@/components/providers/i18n-provider"
import { useShiningCheckout } from "@/hooks/use-shining-checkout"
import {
  FREE_PRIVATE_LIST_LIMIT,
  SHINING_MONTHLY_PRICE_LABEL,
  SHINING_PRODUCT_NAME,
  SHINING_TRIAL_DAYS,
} from "@/lib/plans"
import { pageBelowNavClass, pageContainerClass } from "@/lib/page-container"
import { cn } from "@/lib/utils"

export function PricingPageContent() {
  const { t } = useT()
  const { profile } = useProfile()
  const searchParams = useSearchParams()
  const { isPremium, loading, startShiningFlow, startCheckout } = useShiningCheckout()
  const autoCheckoutStarted = useRef(false)

  const freeHref = profile?.username ? `/${profile.username}` : "/sign-up"

  // After sign-in with ?checkout=1, go straight to Stripe.
  useEffect(() => {
    if (autoCheckoutStarted.current) return
    if (searchParams.get("checkout") !== "1") return
    if (!profile || isPremium) return
    autoCheckoutStarted.current = true
    void startCheckout()
  }, [searchParams, profile, isPremium, startCheckout])

  const freeFeatures = [
    t("pricing.freeFeatDiary"),
    t("pricing.freeFeatReviews"),
    t("pricing.freeFeatLists", { count: FREE_PRIVATE_LIST_LIMIT }),
    t("pricing.freeFeatProfile"),
  ]

  const shiningFeatures = [
    t("pricing.shiningFeatAll"),
    t("pricing.shiningFeatBadge"),
    t("pricing.shiningFeatThemes"),
    t("pricing.shiningFeatUpload"),
    t("pricing.shiningFeatLists"),
    t("pricing.shiningFeatTrial", { days: SHINING_TRIAL_DAYS }),
  ]

  const shiningBusy = loading === "checkout" || loading === "portal"

  return (
    <main
      className={cn(
        pageBelowNavClass,
        "relative z-10 min-h-dvh bg-background pb-20 text-foreground",
      )}
    >
      <div className={cn(pageContainerClass, "max-w-5xl pt-10 sm:pt-14")}>
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {t("pricing.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("pricing.title")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {t("pricing.subtitle", { days: SHINING_TRIAL_DAYS })}
          </p>
        </header>

        <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6">
          {/* Free */}
          <article className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">{t("pricing.freeName")}</h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("pricing.freePrice")}
              <span className="text-base font-medium text-muted-foreground">
                {" "}
                {t("pricing.perMonth")}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("pricing.freeForever")}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("pricing.freeDesc")}
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {freeFeatures.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40">
                    <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href={freeHref}
              className={cn(
                "mt-8 inline-flex w-full items-center justify-center rounded-full border border-border bg-transparent py-3 text-sm font-semibold text-foreground",
                "transition hover:bg-muted/40",
              )}
            >
              {profile ? t("pricing.freeCtaLogged") : t("pricing.freeCta")}
            </Link>
          </article>

          {/* The Shining — red cloud */}
          <article
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8",
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[-20%] bottom-[-5%] top-[18%] h-auto w-[140%] opacity-90 dark:opacity-100"
            >
              <div
                className="shining-cloud-layer shining-cloud-a absolute inset-0"
                style={{
                  background:
                    "radial-gradient(55% 50% at 30% 70%, hsl(var(--brand) / 0.55) 0%, hsl(var(--brand) / 0.16) 40%, transparent 68%)",
                }}
              />
              <div
                className="shining-cloud-layer shining-cloud-b absolute inset-0"
                style={{
                  background:
                    "radial-gradient(50% 45% at 75% 75%, hsl(var(--brand) / 0.42) 0%, hsl(var(--brand) / 0.12) 45%, transparent 70%)",
                }}
              />
              <div
                className="shining-cloud-layer shining-cloud-c absolute inset-0"
                style={{
                  background:
                    "radial-gradient(40% 35% at 50% 85%, hsl(var(--brand) / 0.35) 0%, transparent 60%)",
                  filter: "blur(8px)",
                }}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-card/20 to-card/90"
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {SHINING_PRODUCT_NAME}
                </h2>
                <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {t("pricing.popular")}
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {SHINING_MONTHLY_PRICE_LABEL}
                <span className="text-base font-medium text-muted-foreground">
                  {" "}
                  {t("pricing.perMonth")}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("pricing.trialNote", { days: SHINING_TRIAL_DAYS })}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("pricing.shiningDesc")}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {shiningFeatures.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/90">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand/10">
                      <Check className="size-3 text-brand" strokeWidth={2.5} aria-hidden />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={shiningBusy}
                onClick={() => void startShiningFlow()}
                className={cn(
                  "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white",
                  "transition hover:bg-brand/90 disabled:opacity-60",
                )}
              >
                {shiningBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {isPremium ? t("pricing.shiningCtaManage") : t("pricing.shiningCta")}
              </button>
            </div>
          </article>
        </div>
      </div>
    </main>
  )
}
