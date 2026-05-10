"use client"

import { UserLists } from "@/components/profile/user-lists"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function ListsPage() {
  const { userData, isOwnProfile } = useProfileLayoutData()

  return (
    <div className="mt-4 w-full">
      <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Lists</h2>
      <div className="mt-1 mb-4 h-[0.3px] w-full bg-muted-foreground/10" />
      <UserLists
        userId={userData.id}
        onLandingPage={isOwnProfile}
        alwaysShowThree
        hideSectionHeading
      />
    </div>
  )
}
