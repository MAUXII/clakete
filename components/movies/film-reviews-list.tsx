"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FaStar } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  user_id: string;
  userData?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface FilmReviewsListProps {
  filmId: number;
}

export function FilmReviewsList({ filmId }: FilmReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Exception while fetching user data:", error);
      return null;
    }
  };

  useEffect(() => {
    async function fetchReviews() {
      try {
        const { data, error } = await supabase
          .from('film_interactions')
          .select('id, rating, review, created_at, user_id')
          .eq('film_id', filmId)
          .not('review', 'is', null)
          .neq('review', '')
          .not('rating', 'is', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching reviews:", error);
          return;
        }

        if (data) {
          // Fetch user data for each review
          const reviewsWithUserData = await Promise.all(
            data.map(async (review) => {
              const userData = await fetchUserData(review.user_id);
              return {
                id: review.id,
                rating: review.rating || 0,
                review: review.review || '',
                createdAt: review.created_at,
                user_id: review.user_id,
                userData: userData || undefined
              };
            })
          );

          setReviews(reviewsWithUserData);
        }
      } catch (error) {
        console.error("Exception while fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [filmId, supabase]);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet. Be the first to review this film!
      </div>
    );
  }

  return (
    <div className="">
      {reviews.map((review) => (
        <div key={review.id} className="group mt-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between"> 
            <div className="flex items-center gap-2">
              <Link href={`/${review.userData?.username}`}>
            <Avatar className="h-11 w-11 rounded-md border dark:border-white/20 border-black/20 aspect-square">
              <AvatarImage src={review.userData?.avatar_url || undefined} alt={review.userData?.display_name || review.userData?.username || ''} />
              <AvatarFallback className="rounded-md text-2xl font-semibold w-full flex">{(review.userData?.display_name?.[0] || review.userData?.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
            </Avatar>
            </Link>
            <div className="h-[10px] w-[1px] bg-muted-foreground/30"></div> 
            <p className="text-sm">Review by <Link href={`/${review.userData?.username}`} className="text-muted-foreground hover:text-[#e94e7a]">@{review.userData?.username}</Link></p>
                  </div>
            <div className="flex items-center">
                  
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`h-4 w-4 ${star <= review.rating ? "text-[#FF0048]" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="space-y-2">
                
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap mt-2">
                  {review.review}
                </p>
              </div>
            </div>
          </div>
          <div className="h-[0.3px]  mt-4 bg-muted-foreground/10"/>
        </div>
       
      ))}
    
    </div>
  );
}