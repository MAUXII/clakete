'use client'

import { usePathname } from 'next/navigation'
import Footer from './footer'
import { useHideAppChromeRequested } from './hide-app-footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  const forceHide = useHideAppChromeRequested()
  const hideFooter =
    forceHide ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/onboarding' ||
    pathname === '/list/new' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    // Individual games run fullscreen; only the /games hub keeps the footer.
    pathname.startsWith('/games/')

  if (hideFooter) return null
  return (
    <div data-clakete-chrome>
      <Footer />
    </div>
  )
}
