"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { toast } from "sonner"
import { useProfile } from "@/components/providers/profile-provider"
import { useT } from "@/components/providers/i18n-provider"
import { hasShiningAccess } from "@/lib/plans"
import type { Database } from "@/lib/supabase/database.types"

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

/** Start Stripe Checkout (upgrade) or Customer Portal (manage). */
export function useShiningCheckout() {
  const { t } = useT()
  const router = useRouter()
  const user = useUser()
  const supabase = useSupabaseClient<Database>()
  const { profile } = useProfile()
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null)

  const isPremium = hasShiningAccess({
    plan: profile?.plan,
    plan_status: profile?.plan_status,
    plan_current_period_end: profile?.plan_current_period_end,
  })

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error || !session?.access_token) {
      throw new Error(t("billing.signInAgain"))
    }
    return session.access_token
  }, [supabase, t])

  const startCheckout = useCallback(async () => {
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent("/price?checkout=1")}`)
      return
    }
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
  }, [user, router, getAccessToken, t])

  const openPortal = useCallback(async () => {
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent("/price")}`)
      return
    }
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
  }, [user, router, getAccessToken, t])

  /** Upgrade → checkout; already Shining → portal. */
  const startShiningFlow = useCallback(async () => {
    if (isPremium) {
      await openPortal()
      return
    }
    await startCheckout()
  }, [isPremium, openPortal, startCheckout])

  return {
    user,
    isPremium,
    loading,
    startCheckout,
    openPortal,
    startShiningFlow,
  }
}
