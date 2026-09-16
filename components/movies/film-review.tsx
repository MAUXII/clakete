"use client";

import { useState } from "react";
import { Globe2, Users } from "lucide-react";
import { IoAdd } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDesignMode } from "@/hooks/use-design-mode";

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
  const designMode = useDesignMode();
  const isGlass = designMode === "glass";

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
        <DialogContent className={cn("sm:max-w-[425px]", isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[20px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
          <DialogHeader>
            <DialogTitle className={cn(isGlass && "text-white font-semibold")}>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your thoughts about this film..."
              className={cn("min-h-[200px] resize-none", isGlass && "rounded-xl border-white/10 bg-white/[0.04] text-white")}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              disabled={disabled}
            />

            <div className={cn("space-y-3 rounded-xl border p-3", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-muted/20")}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={shareToFeed}
                  onCheckedChange={(v) => setShareToFeed(v === true)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <span>
                  <span className={cn("font-medium", isGlass ? "text-white" : "text-foreground")}>Share to feed</span>
                  <span className={cn("mt-0.5 block text-xs", isGlass ? "text-white/40" : "text-muted-foreground")}>
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
                        : isGlass ? "border-white/10 hover:border-white/20" : "border-border/80 hover:border-border",
                    )}
                  >
                    <Users className="size-4 text-brand" />
                    <span className={cn("text-xs font-medium", isGlass ? "text-white" : "text-foreground")}>Friends</span>
                    <span className={cn("text-[10px]", isGlass ? "text-white/40" : "text-muted-foreground")}>
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
                        : isGlass ? "border-white/10 hover:border-white/20" : "border-border/80 hover:border-border",
                    )}
                  >
                    <Globe2 className="size-4 text-brand" />
                    <span className={cn("text-xs font-medium", isGlass ? "text-white" : "text-foreground")}>Public</span>
                    <span className={cn("text-[10px]", isGlass ? "text-white/40" : "text-muted-foreground")}>Anyone on Clakete</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={disabled}
                className={cn(isGlass && "rounded-xl border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className={cn(isGlass ? "rounded-xl bg-white px-5 font-semibold text-black hover:bg-white/90" : "bg-brand hover:bg-brand/90", "disabled:opacity-50")}
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
