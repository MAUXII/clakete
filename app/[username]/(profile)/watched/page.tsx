"use client"

import { WatchedDiary } from "@/components/profile/watched-diary"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function WatchedPage() {
  const { userData, isOwnProfile } = useProfileLayoutData()

  return (
    <div>
      <WatchedDiary
        userId={userData.id}
        username={userData.username}
        isOwnProfile={isOwnProfile}
      />
    </div>
  )
}
