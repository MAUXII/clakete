"use client"

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { UserFavoriteFilms } from "@/components/profile/favorite-films"
import { UserRecentActivity } from "@/components/profile/recent-activity"
import { UserRecentReviews } from "@/components/profile/recent-reviews"
import { UserLists } from "@/components/profile/user-lists"

interface UserData {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
}

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()
  const { username } = use(params)

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

  const handleFilmAdded = () => {
    // Callback para quando um filme é adicionado
  }

  useEffect(() => {
    fetchProfile()
  }, [username])

  if (loading) return <div>Loading...</div>
  if (!userData) return null

  return (
    <div className="w-full mt-4">
      <UserFavoriteFilms 
        userId={userData.id} 
        isEditable={isOwnProfile} 
        onFilmAdded={handleFilmAdded}
      />
      
      <UserRecentActivity userId={userData.id} />
      <div className='mt-4'>
        <UserRecentReviews userId={userData.id} />
      </div>
      <div className='mt-4'>
        <UserLists gridCols={2} alwaysShowThree={true} userId={userData.id} onLandingPage={isOwnProfile} />
      </div>
    </div>
  )
} 
