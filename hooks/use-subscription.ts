"use client"

import { useProfile } from "@/components/providers/profile-provider"
import { hasShiningAccess } from "@/lib/plans"

export function useSubscription() {
  const { profile, loading, refreshProfile } = useProfile()

  const planFields = {
    plan: profile?.plan ?? "free",
    plan_status: profile?.plan_status ?? null,
    plan_current_period_end: profile?.plan_current_period_end ?? null,
  }

  return {
    loading,
    refreshProfile,
    planFields,
    isShining: hasShiningAccess(planFields),
    stripeCustomerId: profile?.stripe_customer_id ?? null,
  }
}
