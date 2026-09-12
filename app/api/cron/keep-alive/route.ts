import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Lightweight keep-alive so Free-tier Supabase projects don't auto-pause.
 * Invoked by Vercel Cron (`vercel.json`) with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY" },
      { status: 500 },
    )
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }

  // Touch Auth + PostgREST — enough activity to keep the project awake.
  const [authRes, restRes] = await Promise.all([
    fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" }),
    fetch(`${url}/rest/v1/`, { headers, cache: "no-store" }),
  ])

  const ok = authRes.ok || restRes.ok
  return NextResponse.json(
    {
      ok,
      auth: authRes.status,
      rest: restRes.status,
      at: new Date().toISOString(),
    },
    { status: ok ? 200 : 502 },
  )
}
