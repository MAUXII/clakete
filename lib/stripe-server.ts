import Stripe from "stripe"

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { typescript: true })
  }
  return stripeSingleton
}

export function getStripePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_SHINING_MONTHLY
  if (!priceId) {
    throw new Error("STRIPE_PRICE_SHINING_MONTHLY is not set")
  }
  return priceId
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}
