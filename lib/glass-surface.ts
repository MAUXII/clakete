/** Shared Glass vs Classic surface tokens for feed / home chrome. */
export function glassSurface(isGlass: boolean) {
  return {
    postBorder: isGlass ? "border-white/[0.08]" : "border-border/80",
    muted: isGlass ? "text-white/45" : "text-muted-foreground",
    mutedSoft: isGlass ? "text-white/40" : "text-muted-foreground",
    body: isGlass ? "text-white/70" : "text-muted-foreground",
    fg: isGlass ? "text-white" : "text-foreground",
    iconBtn: isGlass
      ? "text-white/45 transition hover:bg-white/[0.08] hover:text-white/70"
      : "text-muted-foreground transition hover:bg-muted/50 hover:text-muted-foreground",
    iconBtnIdle: isGlass
      ? "text-white/45 hover:bg-white/[0.08] hover:text-white/70"
      : "text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground",
    avatar: isGlass ? "border-white/15" : "border-border",
    avatarFb: isGlass
      ? "bg-white/10 text-white/40"
      : "bg-muted text-muted-foreground",
    panel: isGlass
      ? "border-white/10 bg-white/[0.03]"
      : "border-border/80 bg-muted/50",
    railCard: isGlass
      ? "rounded-2xl bg-white/[0.035] ring-1 ring-white/[0.08]"
      : "rounded-2xl border border-border bg-muted/40",
    empty: isGlass
      ? "rounded-xl border border-dashed border-white/10 bg-white/[0.03]"
      : "rounded-xl border border-dashed border-border bg-background/70",
    mediaFrame: isGlass
      ? "group/media relative mt-2 block max-w-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/[0.02]"
      : "group/media relative mt-2 block max-w-full overflow-hidden rounded-2xl border border-border bg-card",
    followCta: isGlass
      ? "bg-white text-black hover:bg-white/90"
      : "bg-foreground text-background hover:opacity-90",
    composerHover: isGlass ? "hover:bg-white/[0.04]" : "hover:bg-muted/20",
    composerBorder: isGlass ? "border-white/[0.08]" : "border-border/70",
  } as const
}
