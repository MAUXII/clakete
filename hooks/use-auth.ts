import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

type Profile = {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          setProfile(profile)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return {
    user,
    profile,
    loading,
    signOut,
  }
} 