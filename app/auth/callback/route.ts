import { createClient } from '@/lib/supabase/auth-config'
import { getRequestOrigin } from '@/lib/app-url'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/sign-in'
  const origin = getRequestOrigin(requestUrl)
  const nextPath = next.startsWith('/') ? next : `/${next}`

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(nextPath, origin))
}
