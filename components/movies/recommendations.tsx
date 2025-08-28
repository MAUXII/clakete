import { Movie } from '@/app/film/[id]/page';
import Link from 'next/link';
import { useState } from 'react';
import { MovieCard } from './movie-card';

interface RecommendedMovie {
    title: string;
    poster_path: string;
    id: number;
}

export default function RecommendationsList({ movie }: { movie: Movie }) {
    const recommendedMovies: RecommendedMovie[] = movie.recommendations?.results || [];

    if (recommendedMovies.length === 0) {
        return null;
    }

    return (
        <>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendedMovies.map((recommendedMovie) => (
                    <MovieCard key={recommendedMovie.id} movie={recommendedMovie} />
                ))}
            </div>
        </>
    );
}