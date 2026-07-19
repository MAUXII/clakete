"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toPng, toBlob } from "html-to-image"
import {
  Download,
  Loader2,
  Share2,
  Copy,
  Check,
  Ticket,
  ImageIcon,
  RectangleVertical,
  RectangleHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"
import { TheaterTicket } from "@/components/uitripled/theater-ticket-shadcnui"
import { RatingStars } from "@/components/movies/star-rating"

export interface ShareCardData {
  title: string
  year?: string | null
  posterUrl?: string | null
  backdropUrl?: string | null
  /** User rating, 0–5. */
  rating?: number | null
  watchedLabel?: string | null
  director?: string | null
  caption?: string | null
  handle?: string | null
}

export interface ShareCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ShareCardData
  /** Filename base (without extension) used for downloads. */
  fileBase?: string
}

type ShareModel = "ticket" | "poster"
type TicketOrientation = "vertical" | "horizontal"

/** Instagram Stories base size (DOM). × pixelRatio 3 → 1080×1920. */
const STORIES_W = 360
const STORIES_H = 640
const TICKET_W: Record<TicketOrientation, number> = {
  vertical: 320,
  horizontal: 640,
}

export function ShareCardDialog({
  open,
  onOpenChange,
  data,
  fileBase = "clakete",
}: ShareCardDialogProps) {
  const { t } = useT()
  const exportRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [model, setModel] = useState<ShareModel>("poster")
  const [ticketOrientation, setTicketOrientation] =
    useState<TicketOrientation>("vertical")
  const [includeRating, setIncludeRating] = useState(true)
  const [scale, setScale] = useState(1)
  const [exportSize, setExportSize] = useState({ w: STORIES_W, h: STORIES_H })

  const rating = Math.max(0, Math.min(5, Math.round((data.rating ?? 0) * 2) / 2))
  const hasRating = rating > 0
  const showRating = hasRating && includeRating
  const hasWatched = Boolean(data.watchedLabel)
  const ticketW = TICKET_W[ticketOrientation]

  useEffect(() => {
    if (!open) {
      setCopied(false)
      setBusy(false)
      return
    }
    // Default on when the user has a rating; hide toggle resets state for next open.
    setIncludeRating(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const measure = () => {
      const avail = measureRef.current?.clientWidth ?? STORIES_W
      const naturalW = model === "poster" ? STORIES_W : ticketW
      setScale(Math.min(1, avail / naturalW))
      if (exportRef.current) {
        setExportSize({
          w: exportRef.current.offsetWidth || naturalW,
          h:
            exportRef.current.offsetHeight ||
            (model === "poster" ? STORIES_H : ticketOrientation === "horizontal" ? 280 : 480),
        })
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (measureRef.current) ro.observe(measureRef.current)
    if (exportRef.current) ro.observe(exportRef.current)
    const id = window.setTimeout(measure, 280)
    return () => {
      ro.disconnect()
      window.clearTimeout(id)
    }
  }, [open, model, ticketOrientation, ticketW, showRating, data.posterUrl, data.backdropUrl])

  /** Ticket PNG = ticket only (transparent). Poster = full Stories frame. */
  const exportOptions = useCallback(() => {
    const { w, h } = exportSize
    const transparent = model === "ticket"
    return {
      pixelRatio: 3,
      backgroundColor: transparent ? undefined : "#141414",
      cacheBust: true,
      width: w,
      height: h,
      style: {
        transform: "none",
        width: `${w}px`,
        height: `${h}px`,
        background: transparent ? "transparent" : "#141414",
      },
    }
  }, [exportSize, model])

  const getBlob = useCallback(async () => {
    if (!exportRef.current) return null
    return toBlob(exportRef.current, exportOptions())
  }, [exportOptions])

  const handleDownload = useCallback(async () => {
    if (!exportRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(exportRef.current, exportOptions())
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${fileBase}-${model}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(t("share.downloaded"))
    } catch {
      toast.error(t("share.errorRender"))
    } finally {
      setBusy(false)
    }
  }, [exportOptions, fileBase, model, t])

  const handleShare = useCallback(async () => {
    setBusy(true)
    try {
      const blob = await getBlob()
      if (!blob) throw new Error("no blob")
      const file = new File([blob], `${fileBase}-${model}.png`, {
        type: "image/png",
      })
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean
      }
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: data.title })
      } else {
        await handleDownload()
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        await handleDownload()
      }
    } finally {
      setBusy(false)
    }
  }, [getBlob, fileBase, model, data.title, handleDownload])

  const handleCopy = useCallback(async () => {
    setBusy(true)
    try {
      const blob = await getBlob()
      if (!blob) throw new Error("no blob")
      const ClipboardItemCtor = (
        window as unknown as { ClipboardItem?: typeof ClipboardItem }
      ).ClipboardItem
      if (!ClipboardItemCtor || !navigator.clipboard?.write) {
        await handleDownload()
        return
      }
      await navigator.clipboard.write([
        new ClipboardItemCtor({ "image/png": blob }),
      ])
      setCopied(true)
      toast.success(t("share.copied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      await handleDownload()
    } finally {
      setBusy(false)
    }
  }, [getBlob, handleDownload, t])

  const canWebShare =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { canShare?: unknown }).canShare ===
      "function"

  const modelOptions: {
    value: ShareModel
    label: string
    Icon: typeof Ticket
  }[] = [
    { value: "poster", label: t("share.modelPoster"), Icon: ImageIcon },
    { value: "ticket", label: t("share.modelTicket"), Icon: Ticket },
  ]

  const orientationOptions: {
    value: TicketOrientation
    label: string
    Icon: typeof RectangleVertical
  }[] = [
    { value: "vertical", label: t("share.vertical"), Icon: RectangleVertical },
    {
      value: "horizontal",
      label: t("share.horizontal"),
      Icon: RectangleHorizontal,
    },
  ]

  const previewW = (model === "poster" ? STORIES_W : ticketW) * scale
  const previewH = exportSize.h * scale

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
        <DialogHeader className="space-y-1 border-b border-border/60 px-5 py-4 text-left sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF0048]/12 text-[#e8486b]">
              <Share2 className="h-3.5 w-3.5" />
            </span>
            {t("share.title")}
          </DialogTitle>
          <DialogDescription>{t("share.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="mb-4 flex items-center justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1"
              role="group"
              aria-label={t("share.model")}
            >
              {modelOptions.map(({ value, label, Icon }) => {
                const active = model === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setModel(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-[#FF0048] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {model === "ticket" ? (
            <div className="mb-4 flex items-center justify-center">
              <div
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1"
                role="group"
                aria-label={t("share.orientation")}
              >
                {orientationOptions.map(({ value, label, Icon }) => {
                  const active = ticketOrientation === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTicketOrientation(value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      aria-pressed={active}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {hasRating ? (
            <div className="mb-4 flex items-center justify-center">
              <label
                htmlFor="share-include-rating"
                className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-border/70 bg-muted/40 px-3.5 py-2"
              >
                <Switch
                  id="share-include-rating"
                  checked={includeRating}
                  onCheckedChange={setIncludeRating}
                />
                <Label
                  htmlFor="share-include-rating"
                  className="cursor-pointer text-xs font-medium text-foreground"
                >
                  {t("share.includeRating")}
                </Label>
                <RatingStars
                  value={rating}
                  starClassName="h-3 w-3"
                  emptyClassName="text-muted-foreground/35"
                  className="pointer-events-none"
                />
              </label>
            </div>
          ) : null}

          <div
            ref={measureRef}
            className={cn(
              "flex w-full justify-center overflow-hidden rounded-2xl border border-border/50",
              model === "ticket"
                ? "bg-[repeating-conic-gradient(#1a1a1e_0%_25%,#0e0e12_0%_50%)_50%/16px_16px] py-6"
                : "bg-[#0a0a0a]",
            )}
          >
            <div style={{ width: previewW, height: previewH }}>
              {model === "poster" ? (
                <div
                  ref={exportRef}
                  className="flex flex-col text-white"
                  style={{
                    width: STORIES_W,
                    height: STORIES_H,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    background:
                      "linear-gradient(180deg, #1a1a1e 0%, #121214 45%, #0e0e10 100%)",
                  }}
                >
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 pt-10">
                    <div className="w-full max-w-[248px] overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
                      {data.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={data.posterUrl}
                          alt=""
                          crossOrigin="anonymous"
                          className="aspect-[2/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[2/3] w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
                          {data.title}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-center px-7 pb-10 pt-6 text-center">
                    <h2 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white">
                      {data.title}
                    </h2>
                    {data.director ? (
                      <p className="mt-2 text-[13px] font-normal text-white/85">
                        {t("share.directedBy")}{" "}
                        <span className="font-semibold">{data.director}</span>
                      </p>
                    ) : null}

                    {showRating ? (
                      <div className="mt-3.5 flex items-center justify-center gap-2">
                        <RatingStars
                          value={rating}
                          starClassName="h-4 w-4"
                          emptyClassName="text-white/25"
                        />
                        <span className="text-xs font-medium tabular-nums text-white/70">
                          {rating % 1 === 0 ? rating : rating.toFixed(1)}/5
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-8 flex w-full max-w-[200px] items-center gap-3">
                      <div className="h-px flex-1 bg-white/25" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                        {t("share.on")}
                      </span>
                      <div className="h-px flex-1 bg-white/25" />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/claketelogov2.svg"
                        alt=""
                        className="h-6 w-6"
                      />
                      <span className="text-[15px] font-bold tracking-wide text-white">
                        Clakete
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: ticketW,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <TheaterTicket
                    ref={exportRef}
                    bare
                    orientation={ticketOrientation}
                    badge={(data.caption || t("share.stub")).toUpperCase()}
                    title={data.title.toUpperCase()}
                    titleAccent=""
                    venue={data.director || data.handle || t("share.handle")}
                    dateLabel={t("share.ticketDate")}
                    dateValue={hasWatched ? data.watchedLabel! : undefined}
                    timeLabel={t("share.ticketRating")}
                    timeValue={showRating ? `${rating}/5` : undefined}
                    seatLabel=""
                    seatValue={undefined}
                    backdropUrl={data.backdropUrl}
                    logoSrc="/claketelogov2.svg"
                  />
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {model === "poster" ? t("share.hintPoster") : t("share.hintTicket")}
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 px-5 py-4 sm:flex-row sm:px-6">
          <Button
            type="button"
            className="flex-1 bg-[#FF0048] text-white shadow-sm shadow-[#FF0048]/20 hover:bg-[#e60042]"
            onClick={() => void (canWebShare ? handleShare() : handleDownload())}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" />
            )}
            {t("share.share")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => void handleDownload()}
            disabled={busy}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("share.download")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="sm:w-auto"
            onClick={() => void handleCopy()}
            disabled={busy}
            aria-label={t("share.copy")}
          >
            {copied ? (
              <Check className="h-4 w-4 text-[#FF0048]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
