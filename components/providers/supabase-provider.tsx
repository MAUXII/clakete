'use client'

import { createClient } from '@/lib/supabase/auth-config'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  try {
    const supabase = createClient()

    return (
      <SessionContextProvider supabaseClient={supabase}>
        {children}
      </SessionContextProvider>
    )
  } catch (error) {
    // Fallback when Supabase is not available (e.g., during build)
    return <>{children}</>
  }
}