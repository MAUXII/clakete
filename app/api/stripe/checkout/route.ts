import { NextResponse } from "next/server"
import { getRouteAuthUser } from "@/lib/supabase/route-auth"
import { getSiteUrl, getStripe, getStripePriceId } from "@/lib/stripe-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getRouteAuthUser(request)

    if (!user || !supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
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
      success_url: `${siteUrl}/account/billing?success=1`,
      cancel_url: `${siteUrl}/account/billing?canceled=1`,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: {
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
