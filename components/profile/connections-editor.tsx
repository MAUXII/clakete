"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import {
  buildSocialUrl,
  parseHandleFromUrl,
  socialPlatforms,
  socialUrlForPlatform,
  type SocialDisplayMap,
  type SocialPlatform,
  type SocialUrls,
} from "@/lib/social-platforms"

export type ConnectionsEditorProps = {
  urls: SocialUrls
  onChange: (urls: SocialUrls) => void
  display: SocialDisplayMap
  onDisplayChange: (display: SocialDisplayMap) => void
}

export function ConnectionsEditor({
  urls,
  onChange,
  display,
  onDisplayChange,
}: ConnectionsEditorProps) {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform | null>(null)
  const [handleDraft, setHandleDraft] = useState("")

  const connectedPlatforms = useMemo(
    () => socialPlatforms.filter((p) => Boolean(socialUrlForPlatform(urls, p))),
    [urls],
  )

  useEffect(() => {
    if (!activePlatform) return
    const current = socialUrlForPlatform(urls, activePlatform)
    setHandleDraft(parseHandleFromUrl(activePlatform.prelink, current))
  }, [activePlatform, urls])

  const patchUrl = (platform: SocialPlatform, nextUrl: string | null) => {
    onChange({
      ...urls,
      [platform.dbColumn]: nextUrl,
    })
    if (nextUrl) {
      onDisplayChange({
        ...display,
        [platform.dbColumn]: display[platform.dbColumn] ?? true,
      })
    }
  }

  const setDisplayFor = (platform: SocialPlatform, visible: boolean) => {
    onDisplayChange({
      ...display,
      [platform.dbColumn]: visible,
    })
  }

  const closeDialog = () => {
    setActivePlatform(null)
    setHandleDraft("")
  }

  const saveHandle = () => {
    if (!activePlatform) return
    const next = buildSocialUrl(activePlatform.prelink, handleDraft)
    patchUrl(activePlatform, next)
    closeDialog()
  }

  const clearConnection = () => {
    if (!activePlatform) return
    patchUrl(activePlatform, null)
    closeDialog()
  }

  const removeConnection = (platform: SocialPlatform) => {
    patchUrl(platform, null)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/50 bg-muted/5 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add connection</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a platform, then enter your handle. Connected accounts appear below.
        </p>

        <TooltipProvider delayDuration={300}>
          <div className="mt-5 grid grid-cols-5 gap-3 sm:gap-4">
            {socialPlatforms.map((platform) => {
              const connected = Boolean(socialUrlForPlatform(urls, platform))
              const Icon = platform.icon

              return (
                <Tooltip key={platform.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setActivePlatform(platform)}
                      className={cn(
                        "group relative flex aspect-square w-full items-center justify-center rounded-xl transition-all",
                        "hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        connected
                          ? "ring-1 ring-border/70 ring-offset-1 ring-offset-background"
                          : "ring-0",
                      )}
                      style={{ backgroundColor: platform.color }}
                      aria-label={`${connected ? "Edit" : "Connect"} ${platform.name}`}
                    >
                      <Icon className="size-6 text-white sm:size-7" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{platform.name}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>
      </div>

      {connectedPlatforms.length > 0 ? (
        <div className="space-y-3">

          <div className="space-y-3">
            {connectedPlatforms.map((platform) => {
              const url = socialUrlForPlatform(urls, platform)!
              const handle = parseHandleFromUrl(platform.prelink, url)
              const Icon = platform.icon
              const showOnProfile = display[platform.dbColumn] ?? true

              return (
                <article
                  key={platform.id}
                  className="overflow-hidden rounded-lg border border-border/50 bg-muted/15"
                >
                  <div className="flex items-start gap-3 border-b border-border/40 px-4 py-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: platform.color }}
                    >
                      <Icon className="size-5 text-white" aria-hidden />
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePlatform(platform)}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm"
                    >
                      <p className="truncate text-sm font-semibold text-foreground">{handle}</p>
                      <p className="text-xs text-muted-foreground">{platform.name}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeConnection(platform)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      aria-label={`Remove ${platform.name}`}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-foreground">Display on profile</span>
                    <Switch
                      checked={showOnProfile}
                      onCheckedChange={(checked) => setDisplayFor(platform, checked)}
                      className="data-[state=checked]:bg-[#FF0048]"
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}

      <Dialog open={activePlatform !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          {activePlatform ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: activePlatform.color }}
                  >
                    {(() => {
                      const PlatformIcon = activePlatform.icon
                      return <PlatformIcon className="size-4 text-white" aria-hidden />
                    })()}
                  </span>
                  {activePlatform.name}
                </DialogTitle>
                <DialogDescription>
                  Only your handle goes in the field — the URL prefix stays fixed.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <label htmlFor="social-handle" className="text-xs font-medium text-muted-foreground">
                  Profile link
                </label>
                <InputGroup className="bg-background/80">
                  <InputGroupAddon align="inline-start" className="max-w-[58%] shrink-0 sm:max-w-[65%]">
                    <span className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                      {activePlatform.prelink}
                    </span>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="social-handle"
                    value={handleDraft}
                    onChange={(e) => setHandleDraft(e.target.value)}
                    placeholder="username"
                    className="font-medium px-1 text-[11px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        saveHandle()
                      }
                    }}
                    autoFocus
                  />
                </InputGroup>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={clearConnection}>
                  Clear
                </Button>
                <Button
                  type="button"
                  className="bg-[#FF0048] text-white hover:bg-[#e60042]"
                  onClick={saveHandle}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
