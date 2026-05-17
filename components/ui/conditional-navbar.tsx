'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'

export function ConditionalNavbar() {
  const pathname = usePathname()
  const hideNavbar =
    pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/onboarding'

  if (hideNavbar) return null
  return <Navbar />
}
