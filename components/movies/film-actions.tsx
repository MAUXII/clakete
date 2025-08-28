"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IoEyeOutline, IoEye } from "react-icons/io5";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { IoTimeOutline, IoTime } from "react-icons/io5";
import { IoAdd } from "react-icons/io5";
import { Loader2 } from "lucide-react";

interface FilmActionsProps {
  filmId: number;
  onWatchClick?: () => void;
  onLikeClick?: () => void;
  onWatchlistClick?: () => void;
  isWatched?: boolean;
  isLiked?: boolean;
  isInWatchlist?: boolean;
  loading?: boolean;
  updating?: boolean;
}

export function FilmActions({
  filmId,
  onWatchClick,
  onLikeClick,
  onWatchlistClick,
  isWatched = false,
  isLiked = false,
  isInWatchlist = false,
  loading = false,
  updating = false,
}: FilmActionsProps) {
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
              className={`${
                isWatched
                  ? "bg-[#FF0048]/10 text-[#FF0048] border-[#FF0048]/20 hover:bg-[#FF0048]/20"
                  : "hover:bg-[#FF0048]/10 hover:text-[#FF0048] hover:border-[#FF0048]/20"
              }`}
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
            <p>{isWatched ? "Watched" : "Mark as watched"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onLikeClick}
              variant="outline"
              size="icon"
              disabled={loading || updating}
              className={`${
                isLiked
                  ? "bg-[#FF0048]/10 text-[#FF0048] border-[#FF0048]/20 hover:bg-[#FF0048]/20"
                  : "hover:bg-[#FF0048]/10 hover:text-[#FF0048] hover:border-[#FF0048]/20"
              }`}
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
            <p>{isLiked ? "Liked" : "Like this film"}</p>
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
                className={`${
                  isInWatchlist
                    ? "bg-[#FF0048]/10 text-[#FF0048] border-[#FF0048]/20 hover:bg-[#FF0048]/20"
                    : "hover:bg-[#FF0048]/10 hover:text-[#FF0048] hover:border-[#FF0048]/20"
                }`}
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
              <p>{isInWatchlist ? "In watchlist" : "Add to watchlist"}</p>
            </TooltipContent>
          </Tooltip>
          {!isInWatchlist && !updating && !loading && (
            <div className="absolute -top-1.5 -right-1.5">
              <IoAdd className="h-3 w-3 text-[#FF0048]" />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
