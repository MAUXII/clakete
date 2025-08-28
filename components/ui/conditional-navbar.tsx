'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'

export function ConditionalNavbar() {
  const pathname = usePathname()
  const hideNavbar = pathname === '/sign-in'

  if (hideNavbar) return null
  return <Navbar />
}
