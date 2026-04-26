"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const TMDB = "https://image.tmdb.org/t/p/w300";

type Props = {
  posters: (string | null)[];
  className?: string;
};

const POSTER_W = 88;
const STEP = 48;

function PlaceholderSlot() {
  return <div className="h-full w-full bg-neutral-200 dark:bg-neutral-800" />;
}

/**
 * Overlapping film posters, first in list on the right (Letterboxd-style).
 */
export function ListPosterStack({ posters, className }: Props) {
  const toRender: (string | null)[] =
    posters.length > 0
      ? posters
      : [null, null, null, null, null];

  const h = (POSTER_W * 3) / 2;
  const width = (toRender.length - 1) * STEP + POSTER_W;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{
        width: `${width}px`,
        height: `${h}px`,
      }}
    >
      {toRender.map((path, i) => (
        <div
          key={i}
          className="absolute bottom-0 overflow-hidden rounded-sm bg-neutral-200 ring-2 ring-background shadow-md dark:bg-neutral-800"
          style={{
            right: i * STEP,
            width: POSTER_W,
            height: h,
            zIndex: i + 1,
          }}
        >
          {path && path.trim() !== "" ? (
            <Image
              src={path.startsWith("http") ? path : `${TMDB}${path}`}
              alt=""
              width={176}
              height={264}
              className="h-full w-full object-cover"
              sizes="88px"
            />
          ) : (
            <PlaceholderSlot />
          )}
        </div>
      ))}
    </div>
  );
}
