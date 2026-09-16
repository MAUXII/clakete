"use client"

import { UserRecentReviews } from "@/components/profile/recent-reviews"
import { ProfileSectionHeader } from "@/components/profile/profile-section-header"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"
import { useT } from "@/components/providers/i18n-provider"

export default function ReviewsPage() {
  const { t } = useT()
  const { userData } = useProfileLayoutData()

  return (
    <div className="mt-4 w-full">
      <ProfileSectionHeader title={t("profile.reviews")} glassMode="hide" />
      <UserRecentReviews userId={userData.id} limit={200} hideSectionTitle />
    </div>
  )
}
