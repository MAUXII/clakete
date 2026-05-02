"use client"

import { createContext, useContext } from "react"

interface ProfileLayoutUser {
  id: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  banner_url?: string
}

interface ProfileLayoutContextType {
  userData: ProfileLayoutUser
  isOwnProfile: boolean
}

const ProfileLayoutContext = createContext<ProfileLayoutContextType | null>(null)

export function ProfileLayoutProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: ProfileLayoutContextType
}) {
  return <ProfileLayoutContext.Provider value={value}>{children}</ProfileLayoutContext.Provider>
}

export function useProfileLayoutData() {
  const context = useContext(ProfileLayoutContext)
  if (!context) {
    throw new Error("useProfileLayoutData deve ser usado dentro de ProfileLayoutProvider")
  }
  return context
}
