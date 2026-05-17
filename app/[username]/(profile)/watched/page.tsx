"use client"

import { UserRecentActivity } from "@/components/profile/recent-activity"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { notFound } from "next/navigation"
import { use, useEffect, useState } from "react"

export default function WatchedPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("username", username.toLowerCase())
          .single()

        if (error || !data) {
          notFound()
        }

        setUserId(data.id)
      } catch (error) {
        console.error("Erro ao buscar usuário:", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchUserId()
  }, [username, supabase])

  if (loading) return <div>Loading...</div>
  if (!userId) return null

  return (
    <div>
      <UserRecentActivity userId={userId} showAllWatched />
    </div>
  )
}
