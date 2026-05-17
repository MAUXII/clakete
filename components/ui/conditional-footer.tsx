'use client'

import { usePathname } from 'next/navigation'
import Footer from './footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  const hideFooter =
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/onboarding' ||
    pathname === '/list/new'

  if (hideFooter) return null
  return <Footer />
} 