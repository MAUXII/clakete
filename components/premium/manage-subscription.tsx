"use client"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasShiningAccess, SHINING_PRODUCT_NAME, type PlanFields } from "@/lib/plans"
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
  className,
}: {
  planFields: PlanFields
  stripeCustomerId?: string | null
  className?: string
}) {
  const supabase = useSupabaseClient<Database>()
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null)
  const isPremium = hasShiningAccess(planFields)
  const hasCustomer = Boolean(stripeCustomerId)

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
    <div className={cn("space-y-4 rounded-lg border border-border/80 bg-muted/5 p-4 sm:p-5", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Clakete Premium
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{SHINING_PRODUCT_NAME}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isPremium
            ? "Your profile shows the premium highlight. Manage billing below."
            : "Stand out on your public profile with member styling."}
        </p>
        {planFields.plan_status ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Status:{" "}
            <span className="font-medium text-foreground">{planFields.plan_status}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {!isPremium ? (
          <Button
            type="button"
            onClick={startCheckout}
            disabled={loading !== null}
            className="bg-[#FF0048] hover:bg-[#FF0048]/90"
          >
            {loading === "checkout" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Upgrade to {SHINING_PRODUCT_NAME}
          </Button>
        ) : hasCustomer ? (
          <Button
            type="button"
            variant="outline"
            onClick={openPortal}
            disabled={loading !== null}
          >
            {loading === "portal" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Manage subscription
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startCheckout}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === "checkout" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Complete setup
          </Button>
        )}
      </div>
    </div>
  )
}
