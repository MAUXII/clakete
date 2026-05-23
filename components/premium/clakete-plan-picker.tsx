"use client"

import NumberFlow from "@number-flow/react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  hasShiningAccess,
  SHINING_PRODUCT_NAME,
  type PlanFields,
} from "@/lib/plans"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "your movie diary",
    priceLabel: "$0",
    period: "forever",
    features: [
      "Diary: watched, ratings, and dates",
      "Reviews and public lists",
      "Full public profile",
    ],
  },
  {
    id: "shining",
    name: SHINING_PRODUCT_NAME,
    description: "premium member",
    priceLabel: null as string | null,
    monthlyPrice: 4.99,
    period: "month",
    features: [
      "Everything in Free",
      "Visual highlight on your profile",
      "Premium badge and styling",
      "More features coming soon",
    ],
  },
] as const

type PlanId = (typeof PLANS)[number]["id"]

interface ClaketePlanPickerProps {
  planFields: PlanFields
  stripeCustomerId?: string | null
  onCheckout: () => void | Promise<void>
  onPortal?: () => void | Promise<void>
  checkoutLoading?: boolean
  portalLoading?: boolean
  /** Inside edit-profile modal — no duplicate title, slightly tighter spacing */
  embedded?: boolean
  className?: string
}

export function ClaketePlanPicker({
  planFields,
  stripeCustomerId,
  onCheckout,
  onPortal,
  checkoutLoading = false,
  portalLoading = false,
  embedded = false,
  className,
}: ClaketePlanPickerProps) {
  const isPremium = hasShiningAccess(planFields)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    isPremium ? "shining" : "free",
  )

  const hasCustomer = Boolean(stripeCustomerId)

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        embedded
          ? "gap-4"
          : "max-w-[450px] gap-6 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {!embedded ? (
        <div className="mb-1 flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Choose your plan
          </h2>
          <p className="text-sm text-zinc-500">
            {isPremium
              ? "You have premium access. Manage billing below."
              : "Upgrade for profile highlights and upcoming perks."}
          </p>
          {planFields.plan_status ? (
            <p className="text-xs text-zinc-600">
              Status:{" "}
              <span className="font-medium text-zinc-400">{planFields.plan_status}</span>
            </p>
          ) : null}
        </div>
      ) : planFields.plan_status ? (
        <p className="text-xs text-zinc-600">
          Status:{" "}
          <span className="font-medium text-zinc-400">{planFields.plan_status}</span>
        </p>
      ) : null}

      <div className={cn("flex flex-col", embedded ? "gap-2.5" : "gap-3")}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const isCurrent =
            plan.id === "shining" ? isPremium : !isPremium

          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlan(plan.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedPlan(plan.id)
                }
              }}
              className="relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/40"
            >
              <div
                className={cn(
                  "relative rounded-xl border bg-[#09090B] transition-colors duration-300",
                  isSelected
                    ? "z-10 border-2 border-[#FF0048] shadow-[0_0_24px_-8px_rgba(255,0,72,0.45)]"
                    : "border-white/[0.08]",
                )}
              >
                <div className={cn(embedded ? "p-4" : "p-5")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                            isSelected
                              ? "border-[#FF0048]"
                              : "border-zinc-600/50",
                          )}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {isSelected ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="h-3.5 w-3.5 rounded-full bg-[#FF0048]"
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25,
                                }}
                              />
                            ) : null}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium leading-tight text-white">
                          {plan.name}
                        </h3>
                        <p className="text-sm lowercase text-zinc-500">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      {isCurrent ? (
                        <span className="rounded-full bg-[#FF0048]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ff9eb0]">
                          Current
                        </span>
                      ) : null}
                      <div className="text-xl font-medium text-white">
                        {plan.id === "shining" && plan.monthlyPrice != null ? (
                          <NumberFlow
                            value={plan.monthlyPrice}
                            format={{ style: "currency", currency: "USD" }}
                          />
                        ) : (
                          plan.priceLabel
                        )}
                      </div>
                      <div className="text-xs text-zinc-600">
                        {plan.period === "forever" ? "Free" : "per month"}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSelected ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.32, 0.72, 0, 1],
                        }}
                        className="w-full overflow-hidden"
                      >
                        <div
                          className={cn(
                            "flex flex-col gap-4",
                            embedded ? "pt-4" : "pt-6",
                          )}
                        >
                          <div
                            className={cn(
                              "flex flex-col",
                              embedded ? "gap-2.5" : "gap-3",
                            )}
                          >
                            {plan.features.map((feature, idx) => (
                              <motion.div
                                key={feature}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: idx * 0.05,
                                  duration: 0.3,
                                }}
                                className="flex items-center gap-3 text-sm text-zinc-300"
                              >
                                <Check
                                  className="h-4 w-4 shrink-0 text-[#FF0048]"
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                                {feature}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {selectedPlan === "shining" && !isPremium ? (
          <Button
            type="button"
            onClick={() => void onCheckout()}
            disabled={checkoutLoading || portalLoading}
            className="w-full rounded-full bg-[#FF0048] text-white hover:bg-[#e60042] sm:flex-1"
          >
            {checkoutLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Upgrade to {SHINING_PRODUCT_NAME}
          </Button>
        ) : null}
        {isPremium && hasCustomer && onPortal ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onPortal()}
            disabled={checkoutLoading || portalLoading}
            className="w-full rounded-full border-white/10 bg-transparent text-zinc-200 hover:border-[#FF0048]/30 hover:bg-[#FF0048]/10 hover:text-white sm:flex-1"
          >
            {portalLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Manage billing
          </Button>
        ) : null}
        {isPremium && !hasCustomer ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onCheckout()}
            disabled={checkoutLoading || portalLoading}
            className="w-full rounded-full border-white/10 sm:flex-1"
          >
            {checkoutLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Complete billing setup
          </Button>
        ) : null}
      </div>
    </div>
  )
}
