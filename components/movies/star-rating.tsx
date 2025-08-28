"use client";

import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StarRatingProps {
  filmId: number;
  initialRating?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

const ratingDescriptions = [
  "No rating",
  "★ Terrible",
  "★★ Poor",
  "★★★ Fair",
  "★★★★ Good",
  "★★★★★ Excellent",
];

export function StarRating({
  filmId,
  initialRating = 0,
  onRate,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRate = (value: number) => {
    if (readonly) return;
    
    // If clicking the same star twice, remove the rating
    if (value === rating) {
      setRating(0);
      onRate?.(0);
    } else {
      setRating(value);
      onRate?.(value);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Tooltip key={star}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={readonly}
                  onMouseEnter={() => !readonly && setHoverRating(star)}
                  onMouseLeave={() => !readonly && setHoverRating(0)}
                  onClick={() => handleRate(star)}
                  className={`p-1 transition-colors ${
                    readonly ? "cursor-default" : "cursor-pointer hover:text-[#FF0048]"
                  } ${
                    (hoverRating ? star <= hoverRating : star <= rating)
                      ? "text-[#FF0048]"
                      : "text-muted-foreground"
                  }`}
                >
                  <FaStar className={size === "sm" ? "h-4 w-4" : "h-auto w-5"} />
                </button>
              </TooltipTrigger>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
