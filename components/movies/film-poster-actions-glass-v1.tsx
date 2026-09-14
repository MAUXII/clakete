"use client"

/**
 * SNAPSHOT — painel de ações Glass abaixo do poster (versão ícones + estrelas).
 * Guardado antes do redesign estilo Leitour (CTA texto + favorito + review).
 * Não remover sem substituir por outra referência; reutilize se quiser voltar atrás.
 */

import { Bookmark, CalendarDays, Check, Clock, Heart, Loader2, Share2 } from "lucide-react"
import { IoEyeOutline } from "react-icons/io5"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import { StarRating } from "@/components/movies/star-rating"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

export type FilmPosterActionsGlassV1Props = {
  isWatched: boolean
  isLiked: boolean
  isInWatchlist: boolean
  rating: number
  loading?: boolean
  interactionsLoading?: boolean
  updating?: boolean
  onWatchClick: () => void
  onLikeClick: () => void
  onWatchlistClick: () => void
  onRate: (value: number) => void
  onLogDiaryClick: () => void
  onAddToListClick: () => void
  onShareClick: () => void
}

export function FilmPosterActionsGlassV1({
  isWatched,
  isLiked,
  isInWatchlist,
  rating,
  loading = false,
  interactionsLoading = false,
  updating = false,
  onWatchClick,
  onLikeClick,
  onWatchlistClick,
  onRate,
  onLogDiaryClick,
  onAddToListClick,
  onShareClick,
}: FilmPosterActionsGlassV1Props) {
  const { t } = useT()
  const busy = loading || interactionsLoading || updating

  return (
    <div className="relative z-10 mt-3 flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onWatchClick}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-[15px] font-medium tracking-[-0.01em] transition duration-150 disabled:opacity-50",
          isWatched
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "bg-white text-black shadow-[0_12px_24px_-8px_rgba(255,255,255,0.25)] hover:bg-white/92",
        )}
      >
        {updating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isWatched ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{t("film.watched")}</span>
          </>
        ) : (
          <>
            <IoEyeOutline className="h-4.5 w-4.5" />
            <span>{t("film.markWatched") || "Assistido"}</span>
          </>
        )}
      </button>

      <LiquidGlass className="w-full !rounded-[12px]">
        <div className="flex flex-col items-center gap-1.5 p-2">
          <div className="flex w-full items-center justify-between px-2 py-0.5">
            <StarRating
              initialRating={rating}
              onRate={onRate}
              readonly={busy}
              size="sm"
              emptyClassName="text-white/20"
              filledClassName="text-brand"
            />

            <div className="h-4 w-px bg-white/10" aria-hidden />

            <div className="flex items-center gap-1">
              <button
                type="button"
                title={isLiked ? t("film.unlike") : t("film.like")}
                disabled={busy}
                onClick={onLikeClick}
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-lg transition-all hover:bg-white/10 active:scale-95",
                  isLiked ? "text-brand" : "text-white/50 hover:text-white",
                )}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isLiked && "fill-brand text-brand",
                  )}
                />
              </button>

              <button
                type="button"
                title={
                  isInWatchlist
                    ? t("film.removeFromWatchlist")
                    : t("film.addToWatchlist")
                }
                disabled={busy}
                onClick={onWatchlistClick}
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-lg transition-all hover:bg-white/10 active:scale-95",
                  isInWatchlist ? "text-amber-400" : "text-white/50 hover:text-white",
                )}
              >
                <Clock
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isInWatchlist && "fill-amber-400/20 text-amber-400",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-1.5 border-t border-white/[0.08] px-1 pt-1.5">
            <button
              type="button"
              title={t("film.logToDiary") || "Registrar no diário"}
              disabled={busy}
              onClick={onLogDiaryClick}
              className="flex h-8 flex-1 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <CalendarDays className="h-4 w-4" />
            </button>

            <button
              type="button"
              title={t("film.addToList") || "Adicionar às listas"}
              disabled={busy}
              onClick={onAddToListClick}
              className="flex h-8 flex-1 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <Bookmark className="h-4 w-4" />
            </button>

            <button
              type="button"
              title={t("film.share")}
              onClick={onShareClick}
              className="flex h-8 flex-1 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}
