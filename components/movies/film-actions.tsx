"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IoEyeOutline, IoEye } from "react-icons/io5";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { IoAdd } from "react-icons/io5";
import { CalendarDays, Loader2, Share2 } from "lucide-react";
import { useT } from "@/components/providers/i18n-provider";

interface FilmActionsProps {
  filmId: number;
  onWatchClick?: () => void;
  onLogDiaryClick?: () => void;
  onLikeClick?: () => void;
  onWatchlistClick?: () => void;
  onShareClick?: () => void;
  isWatched?: boolean;
  isLiked?: boolean;
  isInWatchlist?: boolean;
  loading?: boolean;
  updating?: boolean;
}

const actionBtnClass = (active: boolean) =>
  active
    ? "bg-brand/10 text-brand border-brand/20 hover:bg-brand/20"
    : "hover:bg-brand/10 hover:text-brand hover:border-brand/20";

export function FilmActions({
  onWatchClick,
  onLogDiaryClick,
  onLikeClick,
  onWatchlistClick,
  onShareClick,
  isWatched = false,
  isLiked = false,
  isInWatchlist = false,
  loading = false,
  updating = false,
}: FilmActionsProps) {
  const { t } = useT();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onWatchClick}
              variant="outline"
              size="icon"
              disabled={loading || updating}
              className={actionBtnClass(isWatched)}
            >
              {updating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isWatched ? (
                <IoEye className="h-5 w-5" />
              ) : (
                <IoEyeOutline className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isWatched ? t("film.unmarkWatched") : t("film.markWatched")}</p>
          </TooltipContent>
        </Tooltip>

        {onLogDiaryClick ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onLogDiaryClick}
                variant="outline"
                size="icon"
                disabled={loading || updating}
                className={actionBtnClass(false)}
              >
                <CalendarDays className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("film.logToDiary")}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onLikeClick}
              variant="outline"
              size="icon"
              disabled={loading || updating}
              className={actionBtnClass(isLiked)}
            >
              {updating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLiked ? (
                <IoHeart className="h-5 w-5" />
              ) : (
                <IoHeartOutline className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isLiked ? t("film.liked") : t("film.like")}</p>
          </TooltipContent>
        </Tooltip>

        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onWatchlistClick}
                variant="outline"
                size="icon"
                disabled={loading || updating}
                className={actionBtnClass(isInWatchlist)}
              >
                {updating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isInWatchlist ? (
                  <IoTime className="h-5 w-5" />
                ) : (
                  <IoTimeOutline className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isInWatchlist ? t("film.inWatchlist") : t("film.addToWatchlist")}</p>
            </TooltipContent>
          </Tooltip>
          {!isInWatchlist && !updating && !loading && (
            <div className="absolute -top-1.5 -right-1.5">
              <IoAdd className="h-3 w-3 text-brand" />
            </div>
          )}
        </div>

        {onShareClick ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onShareClick}
                variant="outline"
                size="icon"
                disabled={loading}
                className={actionBtnClass(false)}
                aria-label={t("share.button")}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("share.button")}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
