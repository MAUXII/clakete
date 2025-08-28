import { getPopularMovies } from "@/lib/tmdb/client"
import { MovieCard } from "./movie-card"

export async function MoviesMenu() {
  const { results: movies } = await getPopularMovies()
  
  // Pega apenas o primeiro filme para exibir no menu
  const featuredMovie = movies[0]

  return (
    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
      <li className="row-span-3">
        <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
          <MovieCard movie={featuredMovie} />
        </div>
      </li>
    </ul>
  )
} 