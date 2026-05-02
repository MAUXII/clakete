"use client"

import { UserWatchlist } from "@/components/profile/user-watchlist"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function WatchlistPage() {
  const { userData } = useProfileLayoutData()
  
  return (
    <div className="w-full">
      <UserWatchlist userId={userData.id} />
    </div>
  )
} 