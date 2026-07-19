import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { parseTmdbStoredImageMeta } from '@/lib/tmdb-stored-image'
import type { TmdbStoredImageMeta } from '@/types/tmdb-stored-image'

type Profile = {
  id: string
  username: string
  display_name?: string
  avatar_url?: string | null
  banner_url?: string | null
  avatar_meta?: TmdbStoredImageMeta | null
  banner_meta?: TmdbStoredImageMeta | null
  bio?: string
  created_at: string
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
            .select(
              'id, username, display_name, avatar_url, banner_url, avatar_meta, banner_meta, bio, created_at',
            )
            .eq('id', session.user.id)
            .single()
            
          setProfile(
            profile
              ? {
                  ...profile,
                  avatar_meta: parseTmdbStoredImageMeta(profile.avatar_meta),
                  banner_meta: parseTmdbStoredImageMeta(profile.banner_meta),
                }
              : null,
          )
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