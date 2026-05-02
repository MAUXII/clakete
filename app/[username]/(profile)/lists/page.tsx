"use client"

import { UserLists } from '@/components/profile/user-lists'
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function ListsPage() {
  const { userData, isOwnProfile } = useProfileLayoutData()
  
  return (
    <div className="w-full">
      <div className="mt-4">

        <div className="text-center text-muted-foreground">
          <UserLists userId={userData.id} onLandingPage={isOwnProfile} alwaysShowThree={true} gridCols={2} />
          
        </div>
      </div>
    </div>
  )
} 