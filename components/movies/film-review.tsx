"use client";

import { useState } from "react";
import { Globe2, Users } from "lucide-react";
import { IoAdd } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ReviewSubmitOptions = {
  shareToFeed?: boolean;
  visibility?: "friends" | "public";
};

interface FilmReviewProps {
  filmId: number;
  initialReview?: string;
  onReviewSubmit?: (review: string, options?: ReviewSubmitOptions) => void;
  existingReview?: string;
  disabled?: boolean;
}

export function FilmReview({
  initialReview = "",
  onReviewSubmit,
  existingReview,
  disabled = false,
}: FilmReviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [review, setReview] = useState(initialReview);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [visibility, setVisibility] = useState<"friends" | "public">("friends");

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setReview(initialReview);
      setShareToFeed(false);
      setVisibility("friends");
    }
  };

  const handleSubmit = () => {
    onReviewSubmit?.(review, {
      shareToFeed,
      visibility: shareToFeed ? visibility : undefined,
    });
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-dashed hover:bg-brand/10 hover:text-brand hover:border-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <IoAdd className="mr-2 h-4 w-4" />
            {existingReview ? "Edit Review" : "Review or Log"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your thoughts about this film..."
              className="min-h-[200px] resize-none"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              disabled={disabled}
            />

            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={shareToFeed}
                  onCheckedChange={(v) => setShareToFeed(v === true)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-foreground">Share to feed</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Post this review for people who follow you.
                  </span>
                </span>
              </label>

              {shareToFeed ? (
                <div className="grid grid-cols-2 gap-2 pl-7">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setVisibility("friends")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                      visibility === "friends"
                        ? "border-brand/40 bg-brand/10"
                        : "border-border/80 hover:border-border",
                    )}
                  >
                    <Users className="size-4 text-brand" />
                    <span className="text-xs font-medium">Friends</span>
                    <span className="text-[10px] text-muted-foreground">
                      Mutual follows only
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                      visibility === "public"
                        ? "border-brand/40 bg-brand/10"
                        : "border-border/80 hover:border-border",
                    )}
                  >
                    <Globe2 className="size-4 text-brand" />
                    <span className="text-xs font-medium">Public</span>
                    <span className="text-[10px] text-muted-foreground">Anyone on Clakete</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-brand hover:bg-brand/90 disabled:opacity-50"
                disabled={disabled || !review.trim()}
              >
                {existingReview ? "Update Review" : "Post Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {existingReview && (
        <div className="mt-4 p-4 rounded-md border bg-muted/50">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingReview}</p>
        </div>
      )}
    </div>
  );
}
