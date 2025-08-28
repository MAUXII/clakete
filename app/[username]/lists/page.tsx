"use client"

import { UserLists } from '@/components/profile/user-lists'
import { use } from 'react'
import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { notFound } from 'next/navigation'

interface UserData {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
}

interface ListsPageProps {
  params: Promise<{
    username: string
  }>
}

export default function ListsPage({ params }: ListsPageProps) {
  const { username } = use(params)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single()

      if (error || !data) {
        notFound()
      }

      setUserData(data)
      setIsOwnProfile(session?.user?.id === data.id)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [username])

  if (loading) return <div>Loading...</div>
  if (!userData) return null
  
  return (
    <div className="w-full">
      <div className="mt-4">

        <div className="text-center text-muted-foreground">
          <UserLists userId={userData.id} onLandingPage={isOwnProfile} alwaysShowThree={true} gridCols={2} />
          
        </div>
      </div>
    </div>
  )
} 