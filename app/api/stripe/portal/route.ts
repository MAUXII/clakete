import { NextResponse } from "next/server"
import { getRouteAuthUser } from "@/lib/supabase/route-auth"
import { getSiteUrl, getStripe } from "@/lib/stripe-server"

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
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account. Subscribe first." },
        { status: 400 },
      )
    }

    const stripe = getStripe()
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getSiteUrl()}/account/billing`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (e) {
    console.error("[stripe/portal]", e)
    const message = e instanceof Error ? e.message : "Portal failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
