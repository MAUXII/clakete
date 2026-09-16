"use client"

import { UserLists } from "@/components/profile/user-lists"
import { ProfileSectionHeader } from "@/components/profile/profile-section-header"
import { useProfileLayoutData } from "@/components/providers/profile-layout-context"
import { useT } from "@/components/providers/i18n-provider"

export default function ListsPage() {
  const { t } = useT()
  const { userData, isOwnProfile } = useProfileLayoutData()

  return (
    <div className="mt-4 w-full">
      <ProfileSectionHeader title={t("profile.lists")} glassMode="hide" />
      <UserLists
        userId={userData.id}
        onLandingPage={isOwnProfile}
        alwaysShowThree
        hideSectionHeading
      />
    </div>
  )
}
