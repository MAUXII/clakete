"use client"

import { UserRecentReviews } from "@/components/profile/recent-reviews"
import { use } from 'react'
import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { notFound } from 'next/navigation'

interface ReviewsPageProps {
  params: Promise<{
    username: string
  }>
}

export default function ReviewsPage({ params }: ReviewsPageProps) {
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
      <UserRecentReviews 
        userId={userId}
        
      />
    </div>
  )
} 