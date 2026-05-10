"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'

import type { TmdbStoredImageMeta } from '@/types/tmdb-stored-image'
import { parseTmdbStoredImageMeta } from '@/lib/tmdb-stored-image'
import type { Json } from '@/lib/supabase/database.types'

interface UserProfile {
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string | null
  banner_url?: string | null
  avatar_meta?: TmdbStoredImageMeta | null
  banner_meta?: TmdbStoredImageMeta | null
  home_preferences?: Json | null
}

interface ProfileContextType {
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useUser()
  const supabase = useSupabaseClient()

  const refreshProfile = useCallback(async () => {
    try {
      if (!user) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile({
        ...data,
        avatar_meta: parseTmdbStoredImageMeta(data.avatar_meta),
        banner_meta: parseTmdbStoredImageMeta(data.banner_meta),
        home_preferences: data.home_preferences ?? null,
      } as UserProfile)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de um ProfileProvider')
  }
  return context
}
