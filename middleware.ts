import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se não estiver autenticado e tentar acessar rotas protegidas
  if (!session && (
    request.nextUrl.pathname.startsWith('/profile')
  )) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Se estiver autenticado e tentar acessar sign-in ou sign-up
  if (session && (
    request.nextUrl.pathname === '/sign-in' ||
    request.nextUrl.pathname === '/sign-up'
  )) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return res
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/sign-in',
    '/sign-up',
    '/:username/watchlist',
    '/:username/filmes'
  ]
} 