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
  plan?: string
  plan_status?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  plan_current_period_end?: string | null
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

      const PUBLIC_USER_COLS =
        'username, display_name, bio, avatar_url, banner_url, avatar_meta, banner_meta, home_preferences, plan, plan_status, plan_current_period_end'

      const { data, error } = await supabase
        .from('users')
        .select(PUBLIC_USER_COLS)
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        setProfile(null)
        return
      }

      if (!data) {
        setProfile(null)
        return
      }

      // Stripe IDs are not selectable on public.users for clients — own row via RPC.
      let stripe_customer_id: string | null = null
      let stripe_subscription_id: string | null = null
      const { data: billing, error: billingError } = await supabase.rpc('get_my_billing')
      if (!billingError && billing && typeof billing === 'object') {
        const row = billing as {
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        stripe_customer_id = row.stripe_customer_id ?? null
        stripe_subscription_id = row.stripe_subscription_id ?? null
      }

      setProfile({
        ...data,
        stripe_customer_id,
        stripe_subscription_id,
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
