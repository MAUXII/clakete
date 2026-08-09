"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClaketePlayback } from "@/hooks/use-clakete-watch";
import { useT } from "@/components/providers/i18n-provider";
import {
  CLAKETE_PLAYER_FRAME,
  ClaketePlayerShell,
} from "@/components/movies/clakete-player-shell";
import { cn } from "@/lib/utils";

type ClaketeWatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  playback: ClaketePlayback | null;
};

export function ClaketeWatchDialog({
  open,
  onOpenChange,
  title,
  playback,
}: ClaketeWatchDialogProps) {
  const { t } = useT();

  if (!playback) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("catalog.claketeUnavailable")}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ClaketePlayerShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t("catalog.claketePlayerHint")}
      tip={playback.kind === "iframe" ? t("catalog.claketePlayerAdTip") : null}
      confirmLeave
    >
      {playback.kind === "video" ? (
        <video
          key={playback.url}
          className={cn(CLAKETE_PLAYER_FRAME, "object-contain")}
          controls
          playsInline
          preload="auto"
          src={playback.url}
          aria-label={title}
        />
      ) : (
        <div className={cn("relative", CLAKETE_PLAYER_FRAME)}>
          <iframe
            key={playback.url}
            title={title}
            src={playback.url}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </ClaketePlayerShell>
  );
}
