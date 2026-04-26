import { useState } from 'react';
import { Movie } from '@/app/film/[id]/page';
import Image from 'next/image';

export default function CastList({ movie }: { movie: Movie }) {
    const [visibleCount, setVisibleCount] = useState(12);
  
    const handleSeeMore = () => {
      setVisibleCount(movie.cast.length); // Show all cast members
    };
  
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {movie.cast.slice(0, visibleCount).map((actor, index) => (
      <div
        key={index}
        className="group flex flex-col w-full rounded-md border dark:border-white/20 border-black/20 overflow-hidden bg-muted-foreground/10 transition-all hover:border-[#FF0048]/35 hover:bg-[#FF0048]/5"
      >
          <div className="relative w-full aspect-square">
            {actor.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`}
                alt={actor.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-medium text-2xl bg-muted-foreground/10">?</div>
            )}
          </div>
          <div className="p-2.5">
            <h3 className="font-medium truncate" title={actor.name}>
              {actor.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1" title={actor.character}>
              {actor.character}
            </p>
          </div>
      </div>
    ))}
        </div>
        {visibleCount < movie.cast.length && (
          <div className="mt-2 items-center justify-center w-full flex">
            <button
              onClick={handleSeeMore}
              className="bg-[#FF0048]/10 text-[#FF0048] p-3 w-full rounded-md border border-black/10 dark:border-white/10  hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
            >
              + See more
            </button>
          </div>
        )}
      </>
    );
  }