"use client"

import { UserRecentActivity } from "@/components/profile/recent-activity"
import { use } from 'react'
import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { notFound } from 'next/navigation'

interface ActivityPageProps {
  params: Promise<{
    username: string
  }>
}

export default function ActivityPage({ params }: ActivityPageProps) {
  const { username } = use(params)
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()
  
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.toLowerCase())
          .single()

        if (error || !data) {
          notFound()
        }

        setUserId(data.id)
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
        setLoading(false)
      }
    }

    fetchUserId()
  }, [username])

  if (loading) return <div>Loading...</div>
  if (!userId) return null
  
  return (
    <div className="w-full">
      <UserRecentActivity 
        userId={userId}
        showAllWatched={true}
      />
    </div>
  )
} 