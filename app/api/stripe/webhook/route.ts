import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe-server"
import {
  clearUserSubscription,
  findUserIdByStripeCustomer,
  syncUserFromSubscription,
} from "@/lib/stripe-sync-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Stripe API 2025+ moves subscription off Invoice; support both shapes. */
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }
  const sub = legacy.subscription
  if (typeof sub === "string") return sub
  if (sub && typeof sub === "object" && "id" in sub) return sub.id

  const parentSub = invoice.parent?.subscription_details?.subscription
  if (typeof parentSub === "string") return parentSub
  return null
}

async function resolveSubscription(
  stripe: ReturnType<typeof getStripe>,
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  })
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[stripe/webhook] signature", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id ?? session.client_reference_id
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

        if (subId) {
          const subscription = await resolveSubscription(stripe, subId)
          await syncUserFromSubscription(subscription, userId)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await syncUserFromSubscription(
          subscription,
          subscription.metadata?.user_id,
        )
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId =
          subscription.metadata?.user_id ||
          (typeof subscription.customer === "string"
            ? await findUserIdByStripeCustomer(subscription.customer)
            : null)

        if (userId) {
          await clearUserSubscription(userId)
        }
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const subId = subscriptionIdFromInvoice(invoice)
        if (subId) {
          const subscription = await resolveSubscription(stripe, subId)
          await syncUserFromSubscription(subscription, null)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId = subscriptionIdFromInvoice(invoice)
        if (subId) {
          const subscription = await resolveSubscription(stripe, subId)
          await syncUserFromSubscription(subscription, null)
        }
        break
      }

      default:
        break
    }
  } catch (e) {
    console.error("[stripe/webhook] handler", event.type, e)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
