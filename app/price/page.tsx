import type { Metadata } from "next"
import { Suspense } from "react"
import { PricingPageContent } from "@/components/pricing/pricing-page-content"

export const metadata: Metadata = {
  title: "Planos · Clakete",
  description: "Free e The Shining — compare os planos do Clakete.",
}

export default function PricePage() {
  return (
    <Suspense fallback={null}>
      <PricingPageContent />
    </Suspense>
  )
}
