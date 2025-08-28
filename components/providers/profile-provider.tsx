"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'

interface UserProfile {
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  banner_url?: string
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

      // Adiciona timestamp para evitar cache
      if (data.avatar_url) {
        data.avatar_url = `${data.avatar_url}?t=${Date.now()}`
      }
      if (data.banner_url) {
        data.banner_url = `${data.banner_url}?t=${Date.now()}`
      }

      setProfile(data)
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
