import { getRequestOrigin } from "@/lib/app-url"
import { safeAuthNextPath } from "@/lib/auth/safe-next-path"
import { createClient } from "@/lib/supabase/auth-config"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = getRequestOrigin(requestUrl)
  const nextPath = safeAuthNextPath(requestUrl.searchParams.get("next"))

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(nextPath, origin))
}
