import { Movie } from '@/app/film/[id]/page';
import Link from 'next/link';
import { useState } from 'react';
import { MovieCard } from './movie-card';

interface SimilarMovie {
    title: string;
    poster_path: string;
    id: number;
}

export default function SimilarList({ movie }: { movie: Movie }) {
    // A API retorna os filmes similares diretamente em similar.results
    const similarMovies: SimilarMovie[] = movie.similar?.results || [];

    if (similarMovies.length === 0) {
        return null;
    }

    return (
        <>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
                {similarMovies.map((similarMovie) => (
                    <MovieCard key={similarMovie.id} movie={similarMovie} />
                ))}
            </div>
        </>
    );
}