import { Movie } from "@/app/film/[id]/page"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDesignMode } from "@/hooks/use-design-mode";
import { cn } from "@/lib/utils";


export interface Video {
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    key: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
    id: string;
  }
export default function Trailer({ movie, setTrailerOpen, trailerOpen }: { movie: Movie, setTrailerOpen: (open: boolean) => void, trailerOpen: boolean }){
    const trailer = movie.videos?.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube');
    const designMode = useDesignMode();
    const isGlass = designMode === "glass";

    return(
        <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogTitle className="flex items-center gap-2 text-sm" />
        <DialogContent className={cn("sm:max-w-[850px] p-0 overflow-clip", isGlass && "border-white/10 bg-black/90 sm:rounded-[24px] shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
        {trailer ? (
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="p-4 text-center">No trailer available</div>
          )}
        </DialogContent>
      </Dialog>
    )
}