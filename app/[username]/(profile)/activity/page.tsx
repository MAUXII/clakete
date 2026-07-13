"use client"

import { UserRecentActivity } from "@/components/profile/recent-activity"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function ActivityPage() {
  const { userData } = useProfileLayoutData()

  return (
    <div className="w-full">
      <UserRecentActivity userId={userData.id} showAllWatched />
    </div>
  )
}
