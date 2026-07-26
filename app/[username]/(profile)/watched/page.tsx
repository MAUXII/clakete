"use client"

import { WatchedGrid } from "@/components/profile/watched-grid"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function WatchedPage() {
  const { userData, isOwnProfile } = useProfileLayoutData()

  return (
    <div>
      <WatchedGrid
        userId={userData.id}
        username={userData.username}
        isOwnProfile={isOwnProfile}
      />
    </div>
  )
}
