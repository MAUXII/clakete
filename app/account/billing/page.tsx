"use client"

import { useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@supabase/auth-helpers-react"
import { toast } from "sonner"
import { ManageSubscription } from "@/components/premium/manage-subscription"
import { useSubscription } from "@/hooks/use-subscription"
import { ShiningBadge } from "@/components/premium/shining-badge"

function BillingContent() {
  const user = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { planFields, isShining, stripeCustomerId, loading, refreshProfile } =
    useSubscription()

  useEffect(() => {
    if (!user) {
      router.replace("/sign-in?next=/account/billing")
    }
  }, [user, router])

  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    if (success === "1") {
      toast.success("Welcome to The Shining! Your profile will update shortly.")
      void refreshProfile()
    } else if (canceled === "1") {
      toast.message("Checkout canceled")
    }
  }, [searchParams, refreshProfile])

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center text-muted-foreground">
        Redirecting to sign in…
      </main>
    )
  }

  return (
    <main className="mx-auto mt-[calc(3.75rem+2rem)] max-w-lg px-4 pb-16 sm:px-6">
      <div className="mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Billing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your Clakete Premium subscription.
        </p>
        {isShining ? (
          <div className="mt-4">
            <ShiningBadge />
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ManageSubscription
          planFields={planFields}
          stripeCustomerId={stripeCustomerId}
        />
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-2 hover:text-foreground">
          Back to home
        </Link>
      </p>
    </main>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-24 text-center text-muted-foreground">
          Loading…
        </main>
      }
    >
      <BillingContent />
    </Suspense>
  )
}
