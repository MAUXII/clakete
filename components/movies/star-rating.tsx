"use client";

import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { cn } from "@/lib/utils";

/** A single star filled 0–100% via a clipped overlay of the same glyph. */
function Star({
  fill,
  starClassName,
  emptyClassName,
  filledClassName = "text-brand",
}: {
  fill: number;
  starClassName: string;
  emptyClassName: string;
  filledClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(1, fill));
  return (
    <span className="relative inline-block leading-none">
      <FaStar className={cn(starClassName, emptyClassName)} />
      {clamped > 0 ? (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${clamped * 100}%` }}
        >
          <FaStar className={cn(starClassName, filledClassName)} />
        </span>
      ) : null}
    </span>
  );
}

/** Read-only star row that supports half-star values (e.g. 3.5). */
export function RatingStars({
  value,
  starClassName = "h-4 w-4",
  emptyClassName = "text-muted-foreground/30",
  className,
}: {
  value: number;
  starClassName?: string;
  emptyClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          fill={value - (star - 1)}
          starClassName={starClassName}
          emptyClassName={emptyClassName}
        />
      ))}
    </div>
  );
}

export interface StarRatingProps {
  filmId?: number;
  initialRating?: number | null;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  emptyClassName?: string;
  filledClassName?: string;
}

export function StarRating({
  initialRating = 0,
  onRate,
  readonly = false,
  size = "md",
  emptyClassName = "text-muted-foreground",
  filledClassName = "text-brand",
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setRating(initialRating ?? 0);
  }, [initialRating]);

  const display = hoverRating || rating;
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  const handleRate = (value: number) => {
    if (readonly) return;
    // Clicking the same value again clears the rating.
    const next = value === rating ? 0 : value;
    setRating(next);
    onRate?.(next);
  };

  return (
    <div className="flex" onMouseLeave={() => !readonly && setHoverRating(0)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="relative leading-none">
            <span className="block p-1">
              <Star
                fill={display - (star - 1)}
                starClassName={iconSize}
                emptyClassName={emptyClassName}
                filledClassName={filledClassName}
              />
            </span>
            {!readonly ? (
              <>
                <button
                  type="button"
                  aria-label={`${star - 0.5} de 5`}
                  className="absolute left-0 top-0 z-10 h-full w-1/2 cursor-pointer"
                  onMouseEnter={() => setHoverRating(star - 0.5)}
                  onClick={() => handleRate(star - 0.5)}
                />
                <button
                  type="button"
                  aria-label={`${star} de 5`}
                  className="absolute right-0 top-0 z-10 h-full w-1/2 cursor-pointer"
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => handleRate(star)}
                />
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
