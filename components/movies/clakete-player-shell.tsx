"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type ClaketePlayerShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Kept for a11y / screen readers; not shown as a text block. */
  description?: string;
  eyebrow?: string;
  tip?: string | null;
  /** When true, closing asks for confirmation with in-app overlay. */
  confirmLeave?: boolean;
  headerStart?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function ClaketePlayerShell({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  tip,
  confirmLeave = false,
  headerStart,
  className,
  children,
}: ClaketePlayerShellProps) {
  const { t } = useT();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setLeaveOpen(false);
      setTipOpen(false);
    }
  }, [open]);

  const requestClose = useCallback(() => {
    if (confirmLeave) {
      setLeaveOpen(true);
      return;
    }
    onOpenChange(false);
  }, [confirmLeave, onOpenChange]);

  const confirmLeaveAndClose = () => {
    setLeaveOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else requestClose();
      }}
    >
      <DialogContent
        hideClose
        className={cn(
          "gap-0 overflow-hidden border-0 bg-black p-0 text-foreground shadow-2xl",
          "w-[min(100vw-0.5rem,96rem)] max-w-[min(100vw-0.5rem,96rem)]",
          "sm:rounded-2xl sm:border sm:border-white/[0.08]",
          className,
        )}
        onPointerDownOutside={(event) => {
          event.preventDefault();
          requestClose();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          if (leaveOpen) {
            setLeaveOpen(false);
            return;
          }
          if (tipOpen) {
            setTipOpen(false);
            return;
          }
          requestClose();
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {description || title}
        </DialogDescription>

        <div className="relative bg-black">
          {children}

          {/* Top chrome — controls only */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 via-black/20 to-transparent pt-3 pb-12">
            <div className="pointer-events-auto flex items-center justify-between gap-2.5 px-3 sm:px-4">
              {headerStart ? (
                <div className="shrink-0">{headerStart}</div>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={requestClose}
                aria-label={t("common.close")}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Title — bottom right */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-10",
              "bg-gradient-to-t from-black/75 via-black/25 to-transparent pt-14 pb-3.5",
              leaveOpen && "opacity-0",
            )}
          >
            <div className="px-4 text-right sm:px-5">
              {eyebrow ? (
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                  {eyebrow}
                </p>
              ) : null}
              <p className="truncate text-base font-medium tracking-tight text-white drop-shadow-sm sm:text-lg">
                {title}
              </p>
            </div>
          </div>

          {tip ? (
            <div
              className={cn(
                "absolute bottom-3 left-3 z-10",
                leaveOpen && "pointer-events-none opacity-0",
              )}
            >
              <button
                type="button"
                onClick={() => setTipOpen((v) => !v)}
                aria-expanded={tipOpen}
                aria-label={t("catalog.claketePlayerHint")}
                className="inline-flex size-8 items-center justify-center rounded-full bg-black/45 text-white/55 backdrop-blur-md transition hover:bg-black/60 hover:text-white/90"
              >
                <Info className="size-3.5" aria-hidden />
              </button>
              {tipOpen ? (
                <div className="absolute bottom-full left-0 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-black/85 px-3 py-2.5 text-[11px] leading-relaxed text-white/70 shadow-xl backdrop-blur-md">
                  <p className="font-medium text-white/90">
                    {t("catalog.claketePlayerHint")}
                  </p>
                  <p className="mt-1 text-white/50">{tip}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {leaveOpen ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-2xl">
                <p className="text-[15px] font-medium tracking-tight text-white">
                  {t("catalog.claketePlayerLeaveTitle")}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                  {t("catalog.claketePlayerLeaveConfirm")}
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaveOpen(false)}
                    className="rounded-lg px-3.5 py-2 text-[13px] text-white/70 transition hover:bg-white/5 hover:text-white"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmLeaveAndClose}
                    className="rounded-lg bg-white px-3.5 py-2 text-[13px] font-medium text-black transition hover:bg-white/90"
                  >
                    {t("catalog.claketePlayerLeaveAction")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const CLAKETE_PLAYER_FRAME =
  "aspect-video max-h-[min(88dvh,calc(100vw*9/16))] w-full";
