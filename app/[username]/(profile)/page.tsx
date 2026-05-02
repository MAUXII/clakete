"use client"

import { UserFavoriteFilms } from "@/components/profile/favorite-films"
import { UserRecentActivity } from "@/components/profile/recent-activity"
import { UserRecentReviews } from "@/components/profile/recent-reviews"
import { UserLists } from "@/components/profile/user-lists"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"

export default function ProfilePage() {
  const { userData, isOwnProfile } = useProfileLayoutData()

  const handleFilmAdded = () => {
    // Callback para quando um filme é adicionado
  }

  return (
    <div className="w-full mt-4">
      <UserFavoriteFilms 
        userId={userData.id} 
        isEditable={isOwnProfile} 
        onFilmAdded={handleFilmAdded}
      />
      
      <UserRecentActivity userId={userData.id} />
      <div className='mt-4'>
        <UserRecentReviews userId={userData.id} />
      </div>
      <div className='mt-4'>
        <UserLists gridCols={2} alwaysShowThree={true} userId={userData.id} onLandingPage={isOwnProfile} />
      </div>
    </div>
  )
} 
