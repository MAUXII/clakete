"use client"

import { UserWatchlist } from "@/components/profile/user-watchlist"
import { use } from 'react'
import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { notFound } from 'next/navigation'

interface WatchlistPageProps {
  params: Promise<{
    username: string
  }>
}

export default function WatchlistPage({ params }: WatchlistPageProps) {
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
      <UserWatchlist userId={userId} />
    </div>
  )
} 