"use client"

import { UserRecentReviews } from "@/components/profile/recent-reviews"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"
import { useT } from "@/components/providers/i18n-provider"

export default function ReviewsPage() {
  const { t } = useT()
  const { userData } = useProfileLayoutData()

  return (
    <div className="mt-4 w-full">
      <h2 className="text-sm font-medium uppercase text-muted-foreground/50">{t("profile.reviews")}</h2>
      <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
      <UserRecentReviews userId={userData.id} limit={200} hideSectionTitle />
    </div>
  )
}
