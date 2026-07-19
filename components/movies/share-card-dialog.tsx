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
type BgStyle = "transparent" | "dark" | "brand"

/** Instagram Stories base size (DOM). × pixelRatio 3 → 1080×1920. */
const STORIES_W = 360
const STORIES_H = 640
const STORIES_EXPORT_W = 1080
const STORIES_EXPORT_H = 1920
const TICKET_W: Record<TicketOrientation, number> = {
  vertical: 320,
  horizontal: 640,
}
/** Approximate natural height used to fit tickets inside Stories 9:16. */
const TICKET_H_EST: Record<TicketOrientation, number> = {
  vertical: 520,
  horizontal: 300,
}

const BG_STYLES: Record<
  BgStyle,
  { preview: string; exportColor: string | undefined }
> = {
  transparent: {
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

/** Same-origin proxy so TMDB images render with CORS (preview + html-to-image). */
function proxiedMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("/") || url.startsWith("data:")) return url
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

/** Flatten PNG → opaque JPEG so Instagram Stories uses full-bleed, not a tiny sticker. */
async function pngBlobToJpeg(
  blob: Blob,
  fillColor = "#0b0b0e",
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    throw new Error("canvas unsupported")
  }
  ctx.fillStyle = fillColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  )
  if (!jpeg) throw new Error("jpeg encode failed")
  return jpeg
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
  const [bgStyle, setBgStyle] = useState<BgStyle>("dark")
  const [includeRating, setIncludeRating] = useState(true)
  const [scale, setScale] = useState(1)
  const [exportSize, setExportSize] = useState({ w: STORIES_W, h: STORIES_H })

  const rating = Math.max(0, Math.min(5, Math.round((data.rating ?? 0) * 2) / 2))
  const hasRating = rating > 0
  const showRating = hasRating && includeRating
  const hasWatched = Boolean(data.watchedLabel)
  const posterSrc = proxiedMediaUrl(data.posterUrl)
  const backdropSrc = proxiedMediaUrl(data.backdropUrl)
  const bg = BG_STYLES[bgStyle]
  /** Ticket + fundo ≠ transparente → sempre Stories 9:16. */
  const ticketInStories = model === "ticket" && bgStyle !== "transparent"
  /** Always lay out the ticket at its natural size (never squeeze). */
  const ticketW = TICKET_W[ticketOrientation]
  const ticketHEst = TICKET_H_EST[ticketOrientation]
  /** Uniform scale so a full-size ticket fits inside the Stories frame. */
  const storiesTicketFit = ticketInStories
    ? Math.min(1, (STORIES_W - 40) / ticketW, (STORIES_H - 40) / ticketHEst)
    : 1
  const frameW =
    model === "poster" || ticketInStories ? STORIES_W : ticketW
  const frameH =
    model === "poster" || ticketInStories ? STORIES_H : undefined

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
      setScale(Math.min(1, avail / frameW))
      if (exportRef.current) {
        setExportSize({
          w: exportRef.current.offsetWidth || frameW,
          h:
            exportRef.current.offsetHeight ||
            frameH ||
            (ticketOrientation === "horizontal" ? 280 : 480),
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
  }, [
    open,
    model,
    ticketOrientation,
    ticketInStories,
    frameW,
    frameH,
    bgStyle,
    showRating,
    posterSrc,
    backdropSrc,
  ])

  const exportOptions = useCallback(() => {
    const stories = model === "poster" || ticketInStories
    // Always pin Stories canvas size — measured DOM size can go wrong with CSS
    // scale/overflow and Instagram then shows a tiny centered sticker.
    const w = stories ? STORIES_W : Math.max(1, exportSize.w)
    const h = stories ? STORIES_H : Math.max(1, exportSize.h)
    const transparent =
      bgStyle === "transparent" && !(model === "poster" || ticketInStories)
    const solidFill = bg.exportColor ?? "#0b0b0e"
    return {
      pixelRatio: stories ? 1 : 3,
      backgroundColor: transparent ? undefined : solidFill,
      cacheBust: true,
      width: w,
      height: h,
      ...(stories
        ? { canvasWidth: STORIES_EXPORT_W, canvasHeight: STORIES_EXPORT_H }
        : {}),
      style: {
        transform: "none",
        width: `${w}px`,
        height: `${h}px`,
        background: transparent
          ? "transparent"
          : bgStyle === "transparent"
            ? solidFill
            : bg.preview,
      },
    }
  }, [
    exportSize.w,
    exportSize.h,
    model,
    ticketInStories,
    bgStyle,
    bg.exportColor,
    bg.preview,
  ])

  const waitForImages = useCallback(async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"))
    await Promise.all(
      imgs.map((img) =>
        img.decode
          ? img.decode().catch(() => undefined)
          : Promise.resolve(undefined),
      ),
    )
  }, [])

  const renderPngDataUrl = useCallback(async () => {
    if (!exportRef.current) throw new Error("no export node")
    await waitForImages(exportRef.current)
    return toPng(exportRef.current, exportOptions())
  }, [exportOptions, waitForImages])

  const getBlob = useCallback(async () => {
    if (!exportRef.current) return null
    await waitForImages(exportRef.current)
    const blob = await toBlob(exportRef.current, exportOptions())
    if (!blob) return null
    if (blob.type === "image/png") return blob
    return new Blob([await blob.arrayBuffer()], { type: "image/png" })
  }, [exportOptions, waitForImages])

  const triggerDownload = useCallback(
    async (dataUrl: string, ext = "png") => {
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${fileBase}-${model}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    },
    [fileBase, model],
  )

  const handleDownload = useCallback(async () => {
    setBusy(true)
    try {
      const dataUrl = await renderPngDataUrl()
      await triggerDownload(dataUrl, "png")
      toast.success(t("share.downloaded"))
    } catch {
      toast.error(t("share.errorRender"))
    } finally {
      setBusy(false)
    }
  }, [renderPngDataUrl, triggerDownload, t])

  const handleShare = useCallback(async () => {
    setBusy(true)
    try {
      const pngBlob = await getBlob()
      if (!pngBlob) throw new Error("no blob")

      // Opaque JPEG at exact 1080×1920 — Instagram Stories treats PNG/wrong
      // ratios as a small sticker over its own background.
      const stories = model === "poster" || ticketInStories
      const shareBlob = stories
        ? await pngBlobToJpeg(pngBlob, bg.exportColor ?? "#0b0b0e")
        : pngBlob
      const ext = stories ? "jpg" : "png"
      const mime = stories ? "image/jpeg" : "image/png"
      const file = new File([shareBlob], `${fileBase}-${model}.${ext}`, {
        type: mime,
        lastModified: Date.now(),
      })
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean
      }
      if (!nav.share) {
        const dataUrl = await renderPngDataUrl()
        await triggerDownload(dataUrl, "png")
        toast.success(t("share.downloaded"))
        toast.message(t("share.instagramHint"))
        return
      }

      // Instagram drops the image when title/text/url are present.
      const filesOnly: ShareData = { files: [file] }
      const withEmptyTitle: ShareData = { files: [file], title: "" }

      if (nav.canShare?.(filesOnly)) {
        await nav.share(filesOnly)
      } else if (nav.canShare?.(withEmptyTitle)) {
        await nav.share(withEmptyTitle)
      } else {
        const dataUrl = await renderPngDataUrl()
        await triggerDownload(dataUrl, "png")
        toast.success(t("share.downloaded"))
        toast.message(t("share.instagramHint"))
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return
      try {
        const dataUrl = await renderPngDataUrl()
        await triggerDownload(dataUrl, "png")
        toast.success(t("share.downloaded"))
        toast.message(t("share.instagramHint"))
      } catch {
        toast.error(t("share.errorRender"))
      }
    } finally {
      setBusy(false)
    }
  }, [
    getBlob,
    fileBase,
    model,
    ticketInStories,
    bg.exportColor,
    renderPngDataUrl,
    triggerDownload,
    t,
  ])

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

  const previewW = frameW * scale
  const previewH = (exportSize.h || frameH || 480) * scale
  const shellPreviewBg =
    bgStyle === "transparent" ? BG_STYLES.transparent.preview : bg.preview
  const exportNodeBg = bgStyle === "transparent" ? "transparent" : bg.preview

  const ticketNode = (
    <TheaterTicket
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
      backdropUrl={backdropSrc}
      logoSrc="/claketelogov2.svg"
    />
  )

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
            className="flex w-full justify-center overflow-hidden rounded-2xl border border-border/50 py-6"
            style={{ background: shellPreviewBg }}
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
                    background: exportNodeBg,
                  }}
                >
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 pt-10">
                    <div className="w-full max-w-[248px] overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10">
                      {posterSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={posterSrc}
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
                    <h2 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                      {data.title}
                    </h2>
                    {data.director ? (
                      <p className="mt-2 text-[13px] font-normal text-white/85 drop-shadow-sm">
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
                      <span className="text-[15px] font-bold tracking-wide text-white drop-shadow-sm">
                        Clakete
                      </span>
                    </div>
                  </div>
                </div>
              ) : ticketInStories ? (
                <div
                  ref={exportRef}
                  className="flex items-center justify-center"
                  style={{
                    width: STORIES_W,
                    height: STORIES_H,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    background: exportNodeBg,
                    boxSizing: "border-box",
                    padding: 20,
                  }}
                >
                  {/*
                    Ticket keeps its natural layout width; we only scale it down
                    to fit Stories — never shrink the CSS width (that clipped titles).
                  */}
                  <div
                    style={{
                      width: ticketW * storiesTicketFit,
                      height: ticketHEst * storiesTicketFit,
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: ticketW,
                        transform: `scale(${storiesTicketFit})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {ticketNode}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={exportRef}
                  style={{
                    width: ticketW,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    background: "transparent",
                  }}
                >
                  {ticketNode}
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {model === "poster"
              ? t("share.hintPoster")
              : bgStyle === "transparent"
                ? t("share.hintTicket")
                : t("share.hintTicketBg")}
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
