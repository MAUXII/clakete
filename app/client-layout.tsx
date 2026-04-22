"use client"

import { ThemeProvider } from "next-themes"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { ProfileProvider } from "@/components/providers/profile-provider"
import { ConditionalNavbar } from "@/components/ui/conditional-navbar"
import { ConditionalFooter } from "@/components/ui/conditional-footer"
import { Toaster } from 'sonner'

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider>
      <ThemeProvider
        attribute="class"
        forcedTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ProfileProvider>
          <ConditionalNavbar />
          {children}
          <ConditionalFooter />
          <Toaster richColors />
        </ProfileProvider>
      </ThemeProvider>
    </SupabaseProvider>
  )
}
