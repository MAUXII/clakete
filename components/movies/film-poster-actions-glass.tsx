"use client"

/**
 * Ações Glass estilo Leitour sob o poster.
 * Snapshot do painel ícones+estrelas: `film-poster-actions-glass-v1.tsx`
 */

import { useRef, useState, type CSSProperties } from "react"
import { Bookmark, Check, Clock, Loader2, MoreHorizontal, Share2 } from "lucide-react"
import { FaPlay } from "react-icons/fa6"
import { GlassMenu, GlassMenuItem } from "@/components/ui/glass-menu"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

export type FilmPosterActionsGlassProps = {
  isWatched: boolean
  isLiked: boolean
  hasReview?: boolean
  loading?: boolean
  interactionsLoading?: boolean
  updating?: boolean
  onWatchClick: () => void
  onLikeClick: () => void
  onReviewClick: () => void
}

export function FilmPosterActionsGlass({
  isWatched,
  isLiked,
  hasReview = false,
  loading = false,
  interactionsLoading = false,
  updating = false,
  onWatchClick,
  onLikeClick,
  onReviewClick,
}: FilmPosterActionsGlassProps) {
  const { t } = useT()
  const busy = loading || interactionsLoading || updating

  const textLinkClass =
    "w-full py-2 text-center text-[13px] font-medium tracking-[-0.01em] text-white/55 transition hover:text-white disabled:opacity-50"

  return (
    <div className="relative z-10 mt-3 flex flex-col items-stretch gap-1">
      {isWatched ? (
        <LiquidGlass
          className="w-full !rounded-[12px] !bg-white/[0.10] transition hover:!bg-white/[0.14]"
          blur={18}
          saturation={1.35}
          style={
            {
              "--liquid-glass-rim-width": "0.85px",
              "--liquid-glass-rim-light": "rgba(255,255,255,0.38)",
              "--liquid-glass-rim-dark": "rgba(0,0,0,0.28)",
              "--liquid-glass-rim-fade": "22%",
            } as CSSProperties
          }
        >
          <button
            type="button"
            disabled={busy}
            onClick={onWatchClick}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-transparent px-5 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-white/95 transition disabled:opacity-50"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 shrink-0 text-white/75" strokeWidth={2.25} />
                <span>{t("film.inWatched") || "Nos assistidos"}</span>
              </>
            )}
          </button>
        </LiquidGlass>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={onWatchClick}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-white px-5 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-black shadow-[0_12px_24px_-8px_rgba(255,255,255,0.25)] transition duration-150 hover:bg-white/92 disabled:opacity-50"
        >
          {updating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("film.addToWatched") || "Adicionar aos assistidos"
          )}
        </button>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={onLikeClick}
        className={cn(textLinkClass, isLiked && "text-brand hover:text-brand/90")}
      >
        {isLiked
          ? t("film.favorited") || "Favoritado"
          : t("film.markFavorite") || "Marcar como favorito"}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onReviewClick}
        className={textLinkClass}
      >
        {hasReview
          ? t("film.editReview") || "Editar review"
          : t("film.writeReview") || "Escrever review"}
      </button>
    </div>
  )
}

/** Play central no poster (hover / touch). */
export function FilmPosterTrailerPlayGlass({
  onClick,
  label,
}: {
  onClick: () => void
  label?: string
}) {
  const { t } = useT()
  const aria = label || t("film.trailer") || "Trailer"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className={cn(
        "absolute inset-0 z-[2] flex items-center justify-center rounded-[14px]",
        "bg-black/0 opacity-0 transition duration-200",
        "hover:bg-black/35 hover:opacity-100",
        "focus-visible:bg-black/35 focus-visible:opacity-100 focus-visible:outline-none",
        "group-hover:bg-black/35 group-hover:opacity-100",
        "group-focus-within:bg-black/35 group-focus-within:opacity-100",
        "[@media(hover:none)]:bg-black/25 [@media(hover:none)]:opacity-100",
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-white/95 text-black shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)] ring-1 ring-white/40 transition group-hover:scale-105">
        <FaPlay className="ml-0.5 h-5 w-5" />
      </span>
    </button>
  )
}

/**
 * Menu ⋯ ao lado do título. Sem scroll-lock.
 *
 * TODO(glass) — depois:
 * - Alterar backdrop da página de detalhe
 * - Alterar / escolher poster
 * (opções no menu; implementação pendente)
 */
export function FilmPosterMoreMenuGlass({
  isInWatchlist,
  disabled,
  onWatchlistClick,
  onAddToListClick,
  onShareClick,
  className,
}: {
  isInWatchlist: boolean
  disabled?: boolean
  onWatchlistClick: () => void
  onAddToListClick: () => void
  onShareClick: () => void
  className?: string
}) {
  const { t } = useT()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const openMenu = () => {
    if (disabled) return
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    setPos({ x: Math.max(8, r.right - 200), y: r.bottom + 6 })
    setOpen(true)
  }

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={t("profile.moreActions") || "Mais opções"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={openMenu}
        className="inline-flex size-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.08] hover:text-white/90 disabled:opacity-50"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      <GlassMenu open={open} x={pos.x} y={pos.y} onClose={() => setOpen(false)} width={200}>
        <GlassMenuItem
          onClick={() => {
            if (disabled) return
            run(onWatchlistClick)
          }}
        >
          <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {isInWatchlist
            ? t("film.removeFromWatchlist") || "Remover de Quero ver"
            : t("film.wantToWatch") || "Quero ver"}
        </GlassMenuItem>
        <GlassMenuItem
          onClick={() => {
            if (disabled) return
            run(onAddToListClick)
          }}
        >
          <Bookmark className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {t("film.addToList") || "Adicionar à lista"}
        </GlassMenuItem>
        <GlassMenuItem onClick={() => run(onShareClick)}>
          <Share2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {t("film.share") || t("share.share") || "Compartilhar"}
        </GlassMenuItem>
      </GlassMenu>
    </div>
  )
}
