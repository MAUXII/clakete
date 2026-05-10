"use client";

import Image from "next/image";
import { Film } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TMDB = "https://image.tmdb.org/t/p/w500";
const MAX = 5;
const COMPACT_OVERLAP_RATIO = 0.36;
const COMPACT_SLOT_MIN = 58;
const COMPACT_SLOT_MAX = 100;

function posterSrc(path: string): string {
  const p = path.trim();
  if (p.startsWith("http")) return p;
  const q = p.startsWith("/") ? p : `/${p}`;
  return `${TMDB}${q}`;
}

type Props = {
  posters: (string | null)[];
  className?: string;
  compact?: boolean;
};

function stackLiftPx(i: number, compact: boolean, slotPx?: number) {
  const d = Math.abs(i - (MAX - 1) / 2);
  const k = compact ? 0.42 : 0.65;
  const scale = compact && slotPx ? Math.min(1.15, slotPx / 72) : 1;
  return Math.round(d * d * k * scale);
}

export function ListPosterStack({ posters, className, compact = false }: Props) {
  const slots: (string | null)[] = [...(posters ?? [])].slice(0, MAX);
  while (slots.length < MAX) slots.push(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [compactMetrics, setCompactMetrics] = useState<{ slot: number; overlap: number } | null>(null);

  const recomputeCompact = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const inner = Math.max(0, w - 2);
    const denom = MAX - (MAX - 1) * COMPACT_OVERLAP_RATIO;
    let slot = inner / denom;
    slot = Math.min(COMPACT_SLOT_MAX, Math.max(COMPACT_SLOT_MIN, slot));
    const overlap = slot * COMPACT_OVERLAP_RATIO;
    setCompactMetrics({ slot, overlap });
  }, []);

  useLayoutEffect(() => {
    if (!compact) {
      setCompactMetrics(null);
      return;
    }
    recomputeCompact();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => recomputeCompact());
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact, recomputeCompact]);

  if (compact) {
    const m = compactMetrics;
    const slot = m?.slot ?? 72;
    const overlap = m?.overlap ?? slot * COMPACT_OVERLAP_RATIO;

    return (
      <div
        ref={containerRef}
        className={cn("flex w-full min-w-0 max-w-full items-end justify-center px-0", className)}
        aria-hidden
      >
        {slots.map((path, i) => (
          <div
            key={i}
            className={cn(
              "relative shrink-0 origin-bottom overflow-hidden rounded-lg bg-gradient-to-b from-muted to-muted/70 ring-2 ring-card dark:from-muted/90 dark:to-muted/45",
            )}
            style={{
              zIndex: i + 1,
              width: slot,
              aspectRatio: "2 / 3",
              marginLeft: i > 0 ? -overlap : 0,
              transform: `translateY(-${stackLiftPx(i, true, slot)}px)`,
            }}
          >
            {path && path.trim() !== "" ? (
              <Image src={posterSrc(path)} alt="" fill className="object-cover" sizes="120px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground/30">
                <Film className="h-[20%] w-[20%] min-h-[0.7rem] min-w-[0.7rem]" strokeWidth={1.15} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-max max-w-full min-w-0 items-end justify-center px-0.5 drop-shadow-[0_16px_32px_rgba(0,0,0,0.24)] transition-transform duration-300 ease-out dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)] group-hover:-translate-y-0.5 group-hover:scale-[1.015]",
        className,
      )}
      aria-hidden
    >
      {slots.map((path, i) => (
        <div
          key={i}
          className={cn(
            "relative aspect-[2/3] shrink-0 origin-bottom overflow-hidden rounded-xl bg-gradient-to-b from-muted to-muted/70 ring-[3px] ring-card shadow-[0_4px_16px_-2px_rgba(0,0,0,0.3)] dark:from-muted/90 dark:to-muted/45 dark:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.52)]",
            "w-[3.95rem] sm:w-[4.55rem] lg:w-[5.25rem]",
            i > 0 && "-ml-[1.18rem] sm:-ml-[1.38rem] lg:-ml-[1.58rem]",
          )}
          style={{
            zIndex: i + 1,
            transform: `translateY(-${stackLiftPx(i, false)}px)`,
          }}
        >
          {path && path.trim() !== "" ? (
            <Image
              src={posterSrc(path)}
              alt=""
              fill
              className="object-cover transition-[filter,transform] duration-300 ease-out group-hover:brightness-[1.06]"
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 165px, 200px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground/30">
              <Film className="h-[20%] w-[20%] min-h-[0.7rem] min-w-[0.7rem]" strokeWidth={1.15} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
