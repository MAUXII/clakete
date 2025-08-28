import { createClient } from '@/lib/supabase/auth-config'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/sign-in' // Usa /sign-in como fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000/'
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redireciona para a página especificada no parâmetro next
  return NextResponse.redirect(`${siteUrl}${next}`)
  
}

