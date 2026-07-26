"use client"

import { Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/providers/i18n-provider"
import type { ConnectNode } from "@/lib/games/connect-the-stars"
import { tmdbPosterUrl } from "@/lib/games/connect-the-stars"
import { cn } from "@/lib/utils"

type Props = {
  node: ConnectNode
  /** Already-discovered neighbors on the board (films for an actor, cast for a film). */
  found: ConnectNode[]
  onClose: () => void
  onHint?: () => void
  hintLoading?: boolean
  hintDisabled?: boolean
}

export function ConnectInspectPanel({
  node,
  found,
  onClose,
  onHint,
  hintLoading = false,
  hintDisabled = false,
}: Props) {
  const { t } = useT()
  const hero = tmdbPosterUrl(node.imagePath, "w500")
  const sectionLabel =
    node.kind === "person" ? t("games.filmsFound") : t("games.castFound")

  return (
    <aside
      className={cn(
        "pointer-events-auto absolute left-3 top-[calc(env(safe-area-inset-top,0px)+7.25rem)] z-40 flex w-[min(100%-1.5rem,18rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-xl backdrop-blur sm:left-4 sm:top-[calc(env(safe-area-inset-top,0px)+7.75rem)]",
        "max-h-[calc(100%-10rem)]",
      )}
    >
      <div className="relative aspect-[2/3] w-full shrink-0 bg-muted">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero}
            alt={node.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            ?
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent px-3 pb-3 pt-12">
          <p className="text-sm font-semibold leading-snug text-foreground">
            {node.name}
          </p>
          {node.subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{node.subtitle}</p>
          ) : null}
        </div>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {onHint ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 border-border bg-background/85 backdrop-blur"
              disabled={hintDisabled || hintLoading}
              onClick={onHint}
              aria-label={t("games.needHint")}
            >
              <Lightbulb className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 border-border bg-background/85 backdrop-blur"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border">
        <p className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {sectionLabel}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {found.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {t("games.noneFoundYet")}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {found.map((item) => {
                const thumb = tmdbPosterUrl(item.imagePath, "w92")
                return (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2"
                  >
                    <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-md bg-muted">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{item.name}</p>
                      {item.subtitle ? (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
