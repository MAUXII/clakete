"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toPng, toBlob } from "html-to-image"
import {
  Download,
  Loader2,
  Share2,
  Copy,
  Check,
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
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"
import { TheaterTicket } from "@/components/uitripled/theater-ticket-shadcnui"

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

type Orientation = "vertical" | "horizontal"
type BgStyle = "transparent" | "dark" | "brand"

const BG_STYLES: Record<
  BgStyle,
  { preview: string; exportColor: string | undefined }
> = {
  transparent: {
    // Checkerboard so "transparent" is visible in the dialog preview.
    preview:
      "repeating-conic-gradient(#1a1a1e 0% 25%, #0e0e12 0% 50%) 50% / 16px 16px",
    exportColor: undefined,
  },
  dark: {
    preview:
      "radial-gradient(120% 75% at 50% 0%, rgba(255,0,72,0.16), transparent 55%), linear-gradient(160deg, #1a1320 0%, #0e0e12 55%, #0b0b0e 100%)",
    exportColor: "#0b0b0e",
  },
  brand: {
    preview:
      "radial-gradient(90% 70% at 50% 20%, #ff4d7a 0%, #FF0048 45%, #b80034 100%)",
    exportColor: "#FF0048",
  },
}

/** Natural (unscaled) width of the exported node per orientation. */
const BASE_WIDTH: Record<Orientation, number> = {
  vertical: 400,
  horizontal: 680,
}

export function ShareCardDialog({
  open,
  onOpenChange,
  data,
  fileBase = "clakete",
}: ShareCardDialogProps) {
  const { t } = useT()
  const ticketRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [orientation, setOrientation] = useState<Orientation>("vertical")
  const [bgStyle, setBgStyle] = useState<BgStyle>("dark")
  const [scale, setScale] = useState(1)
  const [naturalHeight, setNaturalHeight] = useState(560)

  const baseWidth = BASE_WIDTH[orientation]
  const bg = BG_STYLES[bgStyle]

  useEffect(() => {
    if (!open) {
      setCopied(false)
      setBusy(false)
    }
  }, [open])

  // Fit the (fixed-width) ticket into whatever room the dialog gives us, and
  // track its natural height so the reserved box matches the scaled preview.
  useEffect(() => {
    if (!open) return
    const measure = () => {
      const avail = measureRef.current?.clientWidth ?? baseWidth
      setScale(Math.min(1, avail / baseWidth))
      if (ticketRef.current) {
        setNaturalHeight(ticketRef.current.offsetHeight)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (measureRef.current) ro.observe(measureRef.current)
    if (ticketRef.current) ro.observe(ticketRef.current)
    // Re-measure after images (backdrop/logo) settle.
    const id = window.setTimeout(measure, 250)
    return () => {
      ro.disconnect()
      window.clearTimeout(id)
    }
  }, [open, orientation, baseWidth, bgStyle])

  const rating = Math.max(0, Math.min(5, Math.round((data.rating ?? 0) * 2) / 2))
  const hasWatched = Boolean(data.watchedLabel)
  const hasRating = rating > 0

  const exportOptions = useCallback(
    () => ({
      pixelRatio: 3,
      backgroundColor: bg.exportColor,
      cacheBust: true,
      width: baseWidth,
      height: naturalHeight,
      // Render the node at full size regardless of the on-screen preview scale.
      style: {
        transform: "none",
        width: `${baseWidth}px`,
        height: `${naturalHeight}px`,
        background: bgStyle === "transparent" ? "transparent" : bg.preview,
      },
    }),
    [baseWidth, naturalHeight, bg.exportColor, bg.preview, bgStyle],
  )

  const getBlob = useCallback(async () => {
    if (!ticketRef.current) return null
    return toBlob(ticketRef.current, exportOptions())
  }, [exportOptions])

  const handleDownload = useCallback(async () => {
    if (!ticketRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(ticketRef.current, exportOptions())
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${fileBase}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(t("share.downloaded"))
    } catch {
      toast.error(t("share.errorRender"))
    } finally {
      setBusy(false)
    }
  }, [exportOptions, fileBase, t])

  const handleShare = useCallback(async () => {
    setBusy(true)
    try {
      const blob = await getBlob()
      if (!blob) throw new Error("no blob")
      const file = new File([blob], `${fileBase}.png`, { type: "image/png" })
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
  }, [getBlob, fileBase, data.title, handleDownload])

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

  const orientationOptions: {
    value: Orientation
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

  const bgOptions: { value: BgStyle; label: string; swatch: string }[] = [
    {
      value: "transparent",
      label: t("share.bgTransparent"),
      swatch:
        "repeating-conic-gradient(#c4c4c8 0% 25%, #fff 0% 50%) 50% / 8px 8px",
    },
    {
      value: "dark",
      label: t("share.bgDark"),
      swatch: "linear-gradient(135deg, #1a1320, #0b0b0e)",
    },
    {
      value: "brand",
      label: t("share.bgBrand"),
      swatch: "linear-gradient(135deg, #ff4d7a, #FF0048)",
    },
  ]

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
          {/* Orientation */}
          <div className="mb-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
              {orientationOptions.map(({ value, label, Icon }) => {
                const active = orientation === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOrientation(value)}
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

          {/* Background — PNG only; this picks the canvas behind the ticket */}
          <div className="mb-4 flex items-center justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1"
              role="group"
              aria-label={t("share.background")}
            >
              {bgOptions.map(({ value, label, swatch }) => {
                const active = bgStyle === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBgStyle(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={active}
                    title={label}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 dark:border-white/15"
                      style={{ background: swatch }}
                      aria-hidden
                    />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview: real ticket, scaled to fit (hover animations intact). */}
          <div
            ref={measureRef}
            className="flex w-full justify-center overflow-hidden rounded-2xl border border-border/50"
            style={{ background: bg.preview }}
          >
            <div
              style={{
                width: baseWidth * scale,
                height: naturalHeight * scale,
              }}
            >
              <div
                ref={ticketRef}
                style={{
                  width: baseWidth,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  background:
                    bgStyle === "transparent" ? "transparent" : bg.preview,
                }}
              >
                <TheaterTicket
                  orientation={orientation}
                  badge={(data.caption || t("share.stub")).toUpperCase()}
                  title={data.title.toUpperCase()}
                  titleAccent=""
                  venue={data.director || data.handle || t("share.handle")}
                  dateLabel={t("share.ticketDate")}
                  dateValue={hasWatched ? data.watchedLabel! : undefined}
                  timeLabel={t("share.ticketRating")}
                  timeValue={hasRating ? `${rating}/5` : undefined}
                  seatLabel=""
                  seatValue={undefined}
                  backdropUrl={data.backdropUrl}
                  logoSrc="/claketelogov2.svg"
                />
              </div>
            </div>
          </div>
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
