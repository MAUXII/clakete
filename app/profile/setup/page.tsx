'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

/** Legacy route — sends users to sign-up (username modal) or onboarding. */
export default function ProfileSetupRedirect() {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/sign-in')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.username) {
        router.replace('/sign-up')
      } else {
        router.replace('/onboarding')
      }
    }

    void run()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      <p className="text-sm">Redirecting…</p>
    </div>
  )
}
