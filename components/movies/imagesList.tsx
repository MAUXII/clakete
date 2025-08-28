import { useState, useEffect } from 'react';
import { Movie } from '@/app/film/[id]/page';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMasonryCss from 'react-masonry-css'
import Image from 'next/image';
import { Dialog, DialogContent } from '../ui/dialog';

interface ImageData {
  url: string;
  type: 'poster' | 'backdrop';
  loaded: boolean;
}

export default function ImagesList({ movie }: { movie: Movie }) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (movie) {
      const imageBaseUrl = 'https://image.tmdb.org/t/p/original';
      const newImages: ImageData[] = [];

      // Add posters
      if (movie.images?.posters) {
        movie.images.posters.forEach((poster) => {
          newImages.push({
            url: `${imageBaseUrl}${poster.file_path}`,
            type: 'poster',
            loaded: false
          });
        });
      }

      // Add backdrops
      if (movie.images?.backdrops) {
        movie.images.backdrops.forEach((backdrop) => {
          newImages.push({
            url: `${imageBaseUrl}${backdrop.file_path}`,
            type: 'backdrop',
            loaded: false
          });
        });
      }

      // Shuffle the images array
      const shuffledImages = [...newImages].sort(() => Math.random() - 0.5);

      setImages(shuffledImages);
      setLoading(false);
    }
  }, [movie]);

  const handleImageLoad = (url: string) => {
    setImages(prev => 
      prev.map(img => 
        img.url === url ? { ...img, loaded: true } : img
      )
    );
  };

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
  };

  const handleImageError = (url: string) => {
    setImages(prev => prev.filter(img => img.url !== url));
  };
  return (
    <>
      <ReactMasonryCss
      className="flex gap-4"
      breakpointCols={{
        default: 3,
        1080: 2,
      }}
      columnClassName="space-y-4"
    >
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="masonry-item border dark:border-white/20 border-black/20"
              style={{
                aspectRatio: index % 2 === 0 ? '2/3' : '16/9'
              }}
            >
              <Skeleton 
                style={{
                  aspectRatio: index % 2 === 0 ? '2/3' : '16/9'
                }}
                className="h-full w-full skeleton"
              />
            </div>
          ))
        ) : (
          images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="masonry-item border dark:border-white/20 border-black/20"
              style={{
                aspectRatio: image.type === 'poster' ? '2/3' : '16/9'
              }}
            >
              {!image.loaded && (
                <div className="absolute inset-0 z-10">
                  <Skeleton className="h-full w-full skeleton" />
                </div>
              )}
              <Image
                src={image.url}
                alt={`${movie.title} ${image.type} ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => handleImageSelect(image.url)}
                loading="lazy"
                decoding="async"
                height={1920}
                width={1080}
                onLoad={() => handleImageLoad(image.url)}
                onError={() => handleImageError(image.url)}
              />
            </div>
          ))
        )}
      </ReactMasonryCss>

      {selectedImage && (
         <Dialog open={true} onOpenChange={() => setSelectedImage(null)}>
         <DialogContent className="p-0 overflow-clip">
         {selectedImage ? (
             <div className="w-full">
               <Image
                 src={selectedImage}
                 alt="Selected image"
                 className="max-w-full max-h-[90vh] object-contain"
                 height={1920}
                 width={1080}
               />
             </div>
           ) : (
             <div className="p-4 text-center">No image selected</div>
           )}
         </DialogContent>
       </Dialog>
      )}
    </>
  )
  
}
