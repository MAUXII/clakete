"use client"

import { UserRecentActivity } from "@/components/profile/recent-activity"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function WatchedPage() {
  const { userData } = useProfileLayoutData()

  return (
    <div>
      <UserRecentActivity userId={userData.id} showAllWatched />
    </div>
  )
}
