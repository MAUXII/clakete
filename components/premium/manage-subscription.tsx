"use client"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { toast } from "sonner"
import { ClaketePlanPicker } from "@/components/premium/clakete-plan-picker"
import type { PlanFields } from "@/lib/plans"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/database.types"
import { useT } from "@/components/providers/i18n-provider"

async function postJson(
  url: string,
  accessToken: string,
  requestFailedMessage: string,
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
    throw new Error(data.error || requestFailedMessage)
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
  const { t } = useT()
  const supabase = useSupabaseClient<Database>()
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null)

  const getAccessToken = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error || !session?.access_token) {
      throw new Error(t("billing.signInAgain"))
    }
    return session.access_token
  }

  const startCheckout = async () => {
    setLoading("checkout")
    try {
      const token = await getAccessToken()
      const { url } = await postJson(
        "/api/stripe/checkout",
        token,
        t("billing.requestFailed"),
      )
      if (url) window.location.href = url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("billing.checkoutFailed"))
    } finally {
      setLoading(null)
    }
  }

  const openPortal = async () => {
    setLoading("portal")
    try {
      const token = await getAccessToken()
      const { url } = await postJson(
        "/api/stripe/portal",
        token,
        t("billing.requestFailed"),
      )
      if (url) window.location.href = url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("billing.portalFailed"))
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
