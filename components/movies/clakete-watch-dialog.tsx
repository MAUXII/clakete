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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden border-border bg-card p-0 text-foreground">
        <DialogHeader className="border-b border-border px-4 py-3 sm:px-5">
          <DialogTitle className="text-base font-medium">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("catalog.claketePlayerHint")}
          </DialogDescription>
          {playback?.kind === "iframe" ? (
            <p className="text-[11px] leading-snug text-muted-foreground/80">
              {t("catalog.claketePlayerAdTip")}
            </p>
          ) : null}
        </DialogHeader>
        <div className="bg-black">
          {playback ? (
            playback.kind === "video" ? (
              <video
                key={playback.url}
                className="aspect-video w-full object-contain"
                controls
                playsInline
                preload="metadata"
                src={playback.url}
                aria-label={title}
              />
            ) : (
              <div className="relative aspect-video w-full">
                <iframe
                  key={playback.url}
                  title={title}
                  src={playback.url}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
              {t("catalog.claketeUnavailable")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
