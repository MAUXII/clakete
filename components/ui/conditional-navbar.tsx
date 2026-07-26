'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { useHideAppChromeRequested } from './hide-app-footer'

export function ConditionalNavbar() {
  const pathname = usePathname()
  const forceHide = useHideAppChromeRequested()
  const hideNavbar =
    forceHide ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/onboarding'

  if (hideNavbar) return null
  return (
    <div data-clakete-chrome>
      <Navbar />
    </div>
  )
}
