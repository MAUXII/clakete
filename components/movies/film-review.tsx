"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IoAdd } from "react-icons/io5";

interface FilmReviewProps {
  filmId: number;
  initialReview?: string;
  onReviewSubmit?: (review: string) => void;
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

  const handleSubmit = () => {
    onReviewSubmit?.(review);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-dashed hover:bg-[#FF0048]/10 hover:text-[#FF0048] hover:border-[#FF0048]/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="bg-[#FF0048] hover:bg-[#FF0048]/90 disabled:opacity-50"
                disabled={disabled}
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
