"use client"

import { UserActivityLog } from "@/components/profile/user-activity-log"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function ActivityPage() {
  const { userData, isOwnProfile } = useProfileLayoutData()

  return (
    <div className="w-full">
      <UserActivityLog
        userId={userData.id}
        username={userData.username}
        isOwnProfile={isOwnProfile}
      />
    </div>
  )
}
