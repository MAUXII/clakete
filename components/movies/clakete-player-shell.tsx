"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

function isDocumentFullscreen() {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

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

/**
 * Thin Clakete chrome around an embed/video.
 * Does NOT intercept player controls — fullscreen / PiP must come from the embed itself.
 * Dialog is flex-centered without CSS transform (transform on ancestors breaks those APIs).
 */
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
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const ignoreEscapeAfterFsRef = useRef(false);
  const ignoreEscapeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setLeaveOpen(false);
      setTipOpen(false);
      setNativeFullscreen(false);
      ignoreEscapeAfterFsRef.current = false;
      if (ignoreEscapeTimerRef.current != null) {
        window.clearTimeout(ignoreEscapeTimerRef.current);
        ignoreEscapeTimerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const sync = () => {
      const next = isDocumentFullscreen();
      setNativeFullscreen((prev) => {
        // ESC exits embed FS then bubbles here — don't treat as "leave player".
        if (prev && !next) {
          ignoreEscapeAfterFsRef.current = true;
          if (ignoreEscapeTimerRef.current != null) {
            window.clearTimeout(ignoreEscapeTimerRef.current);
          }
          ignoreEscapeTimerRef.current = window.setTimeout(() => {
            ignoreEscapeAfterFsRef.current = false;
            ignoreEscapeTimerRef.current = null;
          }, 500);
        }
        return next;
      });
    };
    sync();

    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      if (ignoreEscapeTimerRef.current != null) {
        window.clearTimeout(ignoreEscapeTimerRef.current);
        ignoreEscapeTimerRef.current = null;
      }
    };
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

  // While the embed owns native fullscreen, hide our chrome so we don't sit on top.
  const showChrome = !nativeFullscreen;

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
          "fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] w-screen max-w-none",
          "!translate-x-0 !translate-y-0 items-center justify-center !transform-none",
          "gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=closed]:!zoom-out-100 data-[state=open]:!zoom-in-100",
          "data-[state=closed]:!slide-out-to-left-0 data-[state=closed]:!slide-out-to-top-0",
          "data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-top-0",
          "sm:rounded-none sm:border-0",
        )}
        style={{ transform: "none" }}
        onPointerDownOutside={(event) => {
          if (nativeFullscreen) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          requestClose();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isDocumentFullscreen() || ignoreEscapeAfterFsRef.current) {
            event.preventDefault();
            return;
          }
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
        onClick={(event) => {
          if (event.target === event.currentTarget && !nativeFullscreen) {
            requestClose();
          }
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {description || title}
        </DialogDescription>

        <div
          className={cn(
            "relative bg-black text-foreground shadow-2xl",
            // No overflow:hidden — can clip / break embed fullscreen & PiP surfaces.
            nativeFullscreen
              ? "h-full w-full max-w-none rounded-none border-0"
              : "w-[min(100vw-0.5rem,96rem)] overflow-hidden sm:rounded-2xl sm:border sm:border-white/[0.08]",
            className,
          )}
        >
          {/* Embed/video gets the full stage — no overlays on the control bar. */}
          {children}

          {showChrome ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 via-black/20 to-transparent pt-3 pb-10">
              <div className="flex items-start justify-between gap-2.5 px-3 sm:px-4">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  {headerStart ? (
                    <div className="pointer-events-auto shrink-0">
                      {headerStart}
                    </div>
                  ) : null}
                  <div className="min-w-0 pt-1.5">
                    {eyebrow ? (
                      <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
                        {eyebrow}
                      </p>
                    ) : null}
                    <p className="truncate text-sm font-medium tracking-tight text-white drop-shadow-sm sm:text-[15px]">
                      {title}
                    </p>
                  </div>
                </div>
                <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                  {tip ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setTipOpen((v) => !v)}
                        aria-expanded={tipOpen}
                        aria-label={t("catalog.claketePlayerHint")}
                        className="inline-flex size-9 items-center justify-center rounded-full bg-black/40 text-white/55 backdrop-blur-md transition hover:bg-black/60 hover:text-white/90"
                      >
                        <Info className="size-3.5" aria-hidden />
                      </button>
                      {tipOpen ? (
                        <div className="absolute right-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-black/85 px-3 py-2.5 text-[11px] leading-relaxed text-white/70 shadow-xl backdrop-blur-md">
                          <p className="font-medium text-white/90">
                            {t("catalog.claketePlayerHint")}
                          </p>
                          <p className="mt-1 text-white/50">{tip}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={requestClose}
                    aria-label={t("common.close")}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {leaveOpen && showChrome ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
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
  "clakete-player-frame aspect-video max-h-[min(88dvh,calc(100vw*9/16))] w-full";
