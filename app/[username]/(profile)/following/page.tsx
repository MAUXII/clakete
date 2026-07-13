"use client"

import { UserFollowersList } from "@/components/profile/user-followers-list"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function FollowingPage() {
  const { userData } = useProfileLayoutData()

  return (
    <div className="w-full">
      <UserFollowersList
        userId={userData.id}
        username={userData.username}
        mode="following"
      />
    </div>
  )
}
