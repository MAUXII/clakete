import { NextResponse } from "next/server"
import { getRouteAuthUser } from "@/lib/supabase/route-auth"
import { createSupabaseAdmin } from "@/lib/supabase-admin"
import { getSiteUrl, getStripe, getStripePriceId } from "@/lib/stripe-server"
import { SHINING_TRIAL_DAYS } from "@/lib/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { user } = await getRouteAuthUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Stripe IDs are revoked from client roles; read via service role after auth.
    const admin = createSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("stripe_customer_id, username")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const stripe = getStripe()
    const siteUrl = getSiteUrl()

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "subscription",
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      success_url: `${siteUrl}/price?success=1`,
      cancel_url: `${siteUrl}/price?canceled=1`,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: {
        trial_period_days: SHINING_TRIAL_DAYS,
        metadata: { user_id: user.id },
      },
      allow_promotion_codes: true,
    }

    if (profile.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id
    } else if (user.email) {
      sessionParams.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("[stripe/checkout]", e)
    const message = e instanceof Error ? e.message : "Checkout failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
