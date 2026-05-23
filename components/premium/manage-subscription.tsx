"use client"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { ClaketePlanPicker } from "@/components/premium/clakete-plan-picker"
import type { PlanFields } from "@/lib/plans"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/database.types"

async function postJson(
  url: string,
  accessToken: string,
): Promise<{ url?: string; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Request failed")
  }
  return data
}

export function ManageSubscription({
  planFields,
  stripeCustomerId,
  embedded = false,
  className,
}: {
  planFields: PlanFields
  stripeCustomerId?: string | null
  /** Tighter layout for edit-profile modal (no duplicate title, less scroll) */
  embedded?: boolean
  className?: string
}) {
  const supabase = useSupabaseClient<Database>()
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null)

  const getAccessToken = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error || !session?.access_token) {
      throw new Error("Please sign in again to continue.")
    }
    return session.access_token
  }

  const startCheckout = async () => {
    setLoading("checkout")
    try {
      const token = await getAccessToken()
      const { url } = await postJson("/api/stripe/checkout", token)
      if (url) window.location.href = url
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Could not start checkout")
    } finally {
      setLoading(null)
    }
  }

  const openPortal = async () => {
    setLoading("portal")
    try {
      const token = await getAccessToken()
      const { url } = await postJson("/api/stripe/portal", token)
      if (url) window.location.href = url
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Could not open billing portal")
    } finally {
      setLoading(null)
    }
  }

  return (
    <ClaketePlanPicker
      embedded={embedded}
      className={cn("max-w-none", className)}
      planFields={planFields}
      stripeCustomerId={stripeCustomerId}
      onCheckout={startCheckout}
      onPortal={openPortal}
      checkoutLoading={loading === "checkout"}
      portalLoading={loading === "portal"}
    />
  )
}
