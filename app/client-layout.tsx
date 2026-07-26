"use client"

import { ThemeProvider } from "next-themes"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { ProfileProvider } from "@/components/providers/profile-provider"
import { I18nProvider } from "@/components/providers/i18n-provider"
import { AppearanceProvider } from "@/components/providers/appearance-provider"
import { ConditionalNavbar } from "@/components/ui/conditional-navbar"
import { ConditionalFooter } from "@/components/ui/conditional-footer"
import { Toaster } from "sonner"

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        storageKey="clakete-color-mode"
        disableTransitionOnChange
      >
        <ProfileProvider>
          <AppearanceProvider>
            <I18nProvider>
              {/*
                Page content first so 404 can set data-hide-chrome before
                fixed navbar/footer HTML is parsed (avoids chrome flash on reload).
              */}
              {children}
              <ConditionalNavbar />
              <ConditionalFooter />
              <Toaster richColors />
            </I18nProvider>
          </AppearanceProvider>
        </ProfileProvider>
      </ThemeProvider>
    </SupabaseProvider>
  )
}
