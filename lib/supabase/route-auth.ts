import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { createServerSupabaseClient } from "@/lib/supabase/server"

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  return { url, key }
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization")
  if (!header?.startsWith("Bearer ")) return null
  const token = header.slice(7).trim()
  return token || null
}

export type RouteAuthResult =
  | { user: User; supabase: SupabaseClient<Database> }
  | { user: null; supabase: null }

/**
 * Resolves the signed-in user for API routes.
 * Client sessions use localStorage, so we accept Bearer tokens from the browser.
 * Cookie-based sessions (SSR) are supported as a fallback.
 */
export async function getRouteAuthUser(request: Request): Promise<RouteAuthResult> {
  const { url, key } = getSupabaseEnv()
  const token = bearerToken(request)

  if (token) {
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data.user) {
      return { user: data.user, supabase }
    }
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (!error && data.user) {
    return { user: data.user, supabase }
  }

  return { user: null, supabase: null }
}
