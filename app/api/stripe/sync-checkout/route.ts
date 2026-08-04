import { NextResponse } from "next/server"
import { getRouteAuthUser } from "@/lib/supabase/route-auth"
import { getStripe } from "@/lib/stripe-server"
import { syncUserFromSubscription } from "@/lib/stripe-sync-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * After Stripe Checkout redirect, sync plan from the session so Apple Pay /
 * wallet flows work even if the webhook is delayed or misconfigured.
 */
export async function POST(request: Request) {
  try {
    const { user } = await getRouteAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as {
      session_id?: string
    } | null
    const sessionId = body?.session_id?.trim()
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })

    const sessionUserId = session.metadata?.user_id ?? session.client_reference_id
    if (sessionUserId && sessionUserId !== user.id) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 })
    }

    if (session.mode !== "subscription") {
      return NextResponse.json({ error: "Not a subscription checkout" }, { status: 400 })
    }

    const subRaw = session.subscription
    const subId = typeof subRaw === "string" ? subRaw : subRaw?.id
    if (!subId) {
      return NextResponse.json(
        { error: "Subscription not ready yet", pending: true },
        { status: 202 },
      )
    }

    const subscription =
      typeof subRaw === "object" && subRaw && "status" in subRaw
        ? subRaw
        : await stripe.subscriptions.retrieve(subId, {
            expand: ["items.data.price"],
          })

    await syncUserFromSubscription(subscription, user.id)

    return NextResponse.json({
      ok: true,
      status: subscription.status,
    })
  } catch (e) {
    console.error("[stripe/sync-checkout]", e)
    const message = e instanceof Error ? e.message : "Sync failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
