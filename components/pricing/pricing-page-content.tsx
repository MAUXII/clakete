"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { useProfile } from "@/components/providers/profile-provider"
import { useT } from "@/components/providers/i18n-provider"
import {
  FREE_PRIVATE_LIST_LIMIT,
  hasShiningAccess,
  SHINING_MONTHLY_PRICE_LABEL,
  SHINING_PRODUCT_NAME,
  SHINING_TRIAL_DAYS,
} from "@/lib/plans"
import { pageBelowNavClass, pageContainerClass } from "@/lib/page-container"
import { cn } from "@/lib/utils"

type CompareRow = {
  key: string
  free: boolean | string
  shining: boolean | string
}

type CompareSection = {
  id: string
  rows: CompareRow[]
}

export function PricingPageContent() {
  const { t } = useT()
  const { profile } = useProfile()
  const isPremium = hasShiningAccess({
    plan: profile?.plan,
    plan_status: profile?.plan_status,
    plan_current_period_end: profile?.plan_current_period_end,
  })

  const shiningHref = profile
    ? "/account/billing"
    : `/sign-in?next=${encodeURIComponent("/account/billing")}`
  const freeHref = profile?.username ? `/${profile.username}` : "/sign-up"

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

  const sections: CompareSection[] = [
    {
      id: "essential",
      rows: [
        { key: "diary", free: true, shining: true },
        { key: "reviews", free: true, shining: true },
        { key: "publicLists", free: true, shining: true },
        {
          key: "privateLists",
          free: String(FREE_PRIVATE_LIST_LIMIT),
          shining: t("pricing.compareUnlimited"),
        },
        { key: "feed", free: true, shining: true },
      ],
    },
    {
      id: "visual",
      rows: [
        { key: "badge", free: false, shining: true },
        { key: "themes", free: false, shining: true },
        { key: "customUpload", free: false, shining: true },
        { key: "earlyAccess", free: false, shining: true },
      ],
    },
  ]

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
          <article className="flex flex-col rounded-2xl border border-border bg-[#0c0c0e] p-6 sm:p-8">
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
              "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-[#0c0c0e] p-6 sm:p-8",
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[-20%] bottom-[-5%] top-[18%] h-auto w-[140%]"
            >
              <div
                className="shining-cloud-layer shining-cloud-a absolute inset-0"
                style={{
                  background:
                    "radial-gradient(55% 50% at 30% 70%, hsl(var(--brand) / 0.7) 0%, hsl(var(--brand) / 0.2) 40%, transparent 68%)",
                }}
              />
              <div
                className="shining-cloud-layer shining-cloud-b absolute inset-0"
                style={{
                  background:
                    "radial-gradient(50% 45% at 75% 75%, hsl(var(--brand) / 0.55) 0%, hsl(var(--brand) / 0.15) 45%, transparent 70%)",
                }}
              />
              <div
                className="shining-cloud-layer shining-cloud-c absolute inset-0"
                style={{
                  background:
                    "radial-gradient(40% 35% at 50% 85%, hsl(var(--brand) / 0.45) 0%, transparent 60%)",
                  filter: "blur(8px)",
                }}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-[#0c0c0e]/15 to-[#0c0c0e]/85"
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                  {SHINING_PRODUCT_NAME}
                </h2>
                <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {t("pricing.popular")}
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {SHINING_MONTHLY_PRICE_LABEL}
                <span className="text-base font-medium text-white/60">
                  {" "}
                  {t("pricing.perMonth")}
                </span>
              </p>
              <p className="mt-1 text-xs text-white/65">
                {t("pricing.trialNote", { days: SHINING_TRIAL_DAYS })}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                {t("pricing.shiningDesc")}
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {shiningFeatures.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-white/95">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
                      <Check className="size-3 text-white" strokeWidth={2.5} aria-hidden />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href={isPremium ? "/account/billing" : shiningHref}
                className={cn(
                  "mt-8 inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-sm font-semibold text-brand",
                  "transition hover:bg-white/90",
                )}
              >
                {isPremium ? t("pricing.shiningCtaManage") : t("pricing.shiningCta")}
              </Link>
            </div>
          </article>
        </div>

        {/* Comparativo */}
        <section className="mt-16 sm:mt-20" aria-labelledby="pricing-compare">
          <div className="text-center">
            <h2
              id="pricing-compare"
              className="text-2xl font-semibold tracking-tight text-foreground"
            >
              {t("pricing.compareTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("pricing.compareSubtitle", { plan: SHINING_PRODUCT_NAME })}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-[#0a0a0c]">
            <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr] border-b border-border px-4 py-4 text-sm sm:px-6">
              <span className="font-medium text-muted-foreground">
                {t("pricing.compareFeature")}
              </span>
              <span className="text-center font-medium text-muted-foreground">
                {t("pricing.freeName")}
                <span className="mt-0.5 block text-xs font-normal">
                  {t("pricing.freePrice")}
                </span>
              </span>
              <span className="rounded-lg bg-brand/10 px-2 py-1 text-center font-medium text-foreground">
                {SHINING_PRODUCT_NAME}
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {SHINING_MONTHLY_PRICE_LABEL}
                  {t("pricing.perMonth")}
                </span>
              </span>
            </div>

            {sections.map((section) => (
              <div key={section.id}>
                <div className="border-b border-border px-4 py-3 sm:px-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t(`pricing.section.${section.id}`)}
                  </p>
                </div>
                {section.rows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[1.2fr_0.7fr_0.9fr] items-center border-b border-border/70 px-4 py-3.5 last:border-b-0 sm:px-6"
                  >
                    <span className="text-sm text-foreground/90">
                      {t(`pricing.row.${row.key}`)}
                    </span>
                    <div className="flex justify-center">
                      <CompareCell value={row.free} />
                    </div>
                    <div className="flex justify-center rounded-lg bg-brand/[0.06] py-1">
                      <CompareCell value={row.shining} accent />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function CompareCell({
  value,
  accent = false,
}: {
  value: boolean | string
  accent?: boolean
}) {
  if (typeof value === "string") {
    return (
      <span
        className={cn(
          "text-xs font-medium sm:text-sm",
          accent ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {value}
      </span>
    )
  }
  if (!value) {
    return <span className="text-sm text-muted-foreground/50">—</span>
  }
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full",
        accent ? "bg-brand/20 text-brand-light" : "bg-muted text-muted-foreground",
      )}
    >
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
    </span>
  )
}
