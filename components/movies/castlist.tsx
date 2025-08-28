import { useState } from 'react';
import { Movie } from '@/app/film/[id]/page';

export default function CastList({ movie }: { movie: Movie }) {
    const [visibleCount, setVisibleCount] = useState(12); // Default to showing 6 cast members
  
    const handleSeeMore = () => {
      setVisibleCount(movie.cast.length); // Show all cast members
    };
  
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {movie.cast.slice(0, visibleCount).map((actor, index) => (
      <div key={index} className=" flex flex-col w-full h-auto rounded-md border dark:border-white/20  border-black/20 overflow-clip items-center gap-1 bg-muted-foreground/10">
          <h3
              className="text-muted-foreground/50 truncate p-2 w-full text-center"
              title={actor.name} 
            >
              {actor.name}
            </h3>
         {actor.profile_path? (
        <img
          src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`}
          alt={actor.name}
          className="w-full aspect-square rounded-md object-cover"
        />
        ):(
          <div className="w-full aspect-square rounded-md flex items-center justify-center font-medium text-2xl bg-muted-foreground/10">?</div>
         )
         }
         
          <p title={actor.character} className="font-medium text-center p-2 truncate w-full">
            {actor.character}
          </p>
         
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