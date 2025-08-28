import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import Trailer, { Video } from "./trailer";
import { Movie } from "@/app/film/[id]/page";
import { FaPlay } from "react-icons/fa6";

interface WatchProvider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

interface CountryData {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

interface MovieTrailer {
  key: string;
  site: string;
  type: string;
  name: string;
}



export default function WatchProviders({ movie }: { movie: Movie }) {
    const [trailerOpen, setTrailerOpen] = useState(false);
  const providers = movie.watchProviders?.results?.US;
  const trailer = movie.videos?.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube');

console.log(trailer)

  if (!providers) {
    return (
        (
            <>
            <Card className=" w-full">
              <CardHeader className="flex-row border-b items-center justify-between py-2 px-6">
                <div>
                  <CardTitle className="uppercase text-muted-foreground">Where to Watch it</CardTitle>
                </div>
                {trailer && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="bg-[#FF0048]/10 text-[#FF0048] gap-2 p-2 rounded-md border border-black/10 dark:border-white/10  hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
                    title="Watch Trailer"
                  >
                    <FaPlay className="w-4 h-auto" />
                  </button>
                )}
              </CardHeader>
              <CardContent className="mt-4 space-y-4 text-muted-foreground">
                  Not Streaming.
              </CardContent>
            </Card>

    <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} /> 
    </>
        )
    );
  }

  const getProviderTypes = (provider: WatchProvider) => {
    const types = [];
    if (providers.flatrate?.some(p => p.provider_id === provider.provider_id)) {
      types.push("Stream");
    }
    if (providers.rent?.some(p => p.provider_id === provider.provider_id)) {
      types.push("Rent");
    }
    if (providers.buy?.some(p => p.provider_id === provider.provider_id)) {
      types.push("Buy");
    }
    return types;
  };

  // Get unique providers
  const allProviders = new Map<number, WatchProvider>();
  [
    ...(providers.flatrate || []),
    ...(providers.rent || []),
    ...(providers.buy || []),
  ].forEach((provider) => {
    if (!allProviders.has(provider.provider_id)) {
      allProviders.set(provider.provider_id, provider);
    }
  });


  return (
    <>
  
      <Card className="w-full">
        <CardHeader className="flex-row border-b items-center justify-between py-2 px-6">
          <div>
            <CardTitle className="uppercase text-muted-foreground">Where to Watch it</CardTitle>
          </div>
          {trailer && (
        <button
          onClick={() => setTrailerOpen(true)}
          className="bg-[#FF0048]/10 text-[#FF0048] gap-2 p-2 rounded-md border border-black/10 dark:border-white/10  hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
          title="Watch Trailer"
        >
          <FaPlay className="w-4 h-auto" />
        </button>
      )}
        </CardHeader>
        <CardContent>
          <div className="mt-4 space-y-4 w-full flex flex-col">
            {Array.from(allProviders.values()).slice(0, 2).map((provider) => (
              <Link
                href={providers.link}
                target="_blank"
                rel="noopener noreferrer"
                key={provider.provider_id}
                className="flex w-full items-center gap-3 group hover:bg-[#FF0048]/10 p-2 rounded-lg transition-colors"
              >
                <div className="relative h-10 aspect-square rounded-lg overflow-hidden border border-border">
                  <Image
                    src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                    alt={provider.provider_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-medium text-nowrap truncate w-[10.5rem] group-hover:text-[#FF0048] transition-colors">
                    {provider.provider_name}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    {getProviderTypes(provider).map((type) => (
                      <span
                        key={type}
                        className="text-xs px-2 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <button
              onClick={() => {}}
            className="bg-[#FF0048]/10 text-[#FF0048] p-3 w-full rounded-md border border-black/10 dark:border-white/10  hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
          >
            + All Watch Providers
          </button>
        </CardFooter>
      </Card>
    
      <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />    </>
  );
}