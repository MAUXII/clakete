import type Stripe from "stripe"
import type { UserPlan } from "@/lib/plans"
import { createSupabaseAdmin } from "@/lib/supabase-admin"

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null
}

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const end = subscriptionPeriodEnd(subscription)
  if (!end) return null
  return new Date(end * 1000).toISOString()
}

export function planStateFromSubscription(
  subscription: Stripe.Subscription,
): { plan: UserPlan; plan_status: string } {
  const status = subscription.status
  const periodEnd = subscriptionPeriodEnd(subscription)
  const stillInPeriod = periodEnd ? periodEnd * 1000 > Date.now() : false

  if (status === "active" || status === "trialing" || status === "past_due") {
    return { plan: "shining", plan_status: status }
  }

  if ((status === "canceled" || status === "unpaid") && stillInPeriod) {
    return { plan: "shining", plan_status: status }
  }

  return { plan: "free", plan_status: status }
}

export async function syncUserFromSubscription(
  subscription: Stripe.Subscription,
  userIdHint?: string | null,
) {
  const admin = createSupabaseAdmin()
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id

  let userId =
    userIdHint ||
    subscription.metadata?.user_id ||
    null

  if (!userId && customerId) {
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()
    userId = data?.id ?? null
  }

  if (!userId) {
    console.error("[stripe-sync] user not found for subscription", subscription.id)
    return
  }

  const { plan, plan_status } = planStateFromSubscription(subscription)

  const { error } = await admin
    .from("users")
    .update({
      plan,
      plan_status,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscription.id,
      plan_current_period_end: periodEndIso(subscription),
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("[stripe-sync] update failed", error)
    throw error
  }
}

export async function clearUserSubscription(userId: string) {
  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from("users")
    .update({
      plan: "free",
      plan_status: "canceled",
      stripe_subscription_id: null,
      plan_current_period_end: null,
      plan_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) throw error
}

export async function findUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  const admin = createSupabaseAdmin()
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle()
  return data?.id ?? null
}
