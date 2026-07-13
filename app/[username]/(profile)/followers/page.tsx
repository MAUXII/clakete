"use client"

import { UserFollowersList } from "@/components/profile/user-followers-list"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function FollowersPage() {
  const { userData } = useProfileLayoutData()

  return (
    <div className="w-full">
      <UserFollowersList
        userId={userData.id}
        username={userData.username}
        mode="followers"
      />
    </div>
  )
}
