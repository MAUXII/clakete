import type { Metadata } from "next"
import { PricingPageContent } from "@/components/pricing/pricing-page-content"

export const metadata: Metadata = {
  title: "Planos · Clakete",
  description: "Free e The Shining — compare os planos do Clakete.",
}

export default function PricePage() {
  return <PricingPageContent />
}
