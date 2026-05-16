import type { Json } from "@/lib/supabase/database.types"
import { getVisibleProfileSocialLinks } from "@/lib/social-platforms"
import { cn } from "@/lib/utils"

export type ProfileSocialLinksProps = {
  social: Parameters<typeof getVisibleProfileSocialLinks>[0]
  homePreferences?: Json | null
  className?: string
}

/** Public profile only — muted Clakete treatment, not brand colors from the editor grid. */
export function ProfileSocialLinks({ social, homePreferences, className }: ProfileSocialLinksProps) {
  const links = getVisibleProfileSocialLinks(social, homePreferences)

  if (links.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {links.map(({ platform, url }) => {
        const Icon = platform.icon
        return (
          <a
            key={platform.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex size-9 items-center justify-center rounded-md border border-border/60 bg-muted/15",
              "text-[#FF0048]/85 transition-colors",
              "hover:border-[#FF0048]/25 hover:bg-[#FF0048]/8 hover:text-[#FF0048]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label={platform.name}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
          </a>
        )
      })}
    </div>
  )
}
