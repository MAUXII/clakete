import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { ImageCropper } from "./image-cropper";
import { Movie } from "@/lib/tmdb/client";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import Masonry from 'react-masonry-css'
import { useProfile } from "@/components/providers/profile-provider"
import ReactMasonryCss from "react-masonry-css";

interface ImageEditDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  onClose: () => void;
  onSave: (image: string) => void;
  type: 'avatar' | 'banner' | 'list';
  onSelect: (image: string) => void;
  isOpen?: boolean;
  customSave?: (imageUrl: string) => Promise<void>;
  listId?: string; // ID da lista para banners de lista
}

export function ImageEditDialog({ onClose, onSelect, isOpen, onSave, type, customSave, listId }: ImageEditDialogProps) {
  const [showSearchCommand, setShowSearchCommand] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [images, setImages] = useState<{ url: string, type: 'poster' | 'banner', aspectRatio: number, loaded: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = useSupabaseClient()
  const debouncedQuery = useDebounce(query, 300)
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Movie[]>([])
  const { refreshProfile } = useProfile()

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true)
      try {
        let endpoint = ""
        if (debouncedQuery.trim().length === 0) {
          // Mostrar filmes mais bem avaliados de todos os tempos
          endpoint = "/api/movies?type=top_rated"
        } else {
          endpoint = `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`
        }
        const response = await fetch(endpoint)
        const data = await response.json()
        setResults(data.results ? data.results.slice(0, 5) : [])
      } catch (error) {
        console.error("Erro ao buscar filmes:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [debouncedQuery])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const fetchImages = async () => {
      if (selectedMovie) {
        setImages([]);
        setLoading(true);
        
        try {
          const response = await fetch(`/api/movies/${selectedMovie.id}/images`);
          const data = await response.json();
          
          let formattedImages = [];

          if (type === 'avatar' || type === 'banner') {
            const posters = (data.posters || []).map((img: any) => ({
              url: `/api/proxy-image?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w500${img.file_path}`)}`,
              type: 'poster' as const,
              loaded: false
            }));
            
            const backdrops = (data.backdrops || []).map((img: any) => ({
              url: `/api/proxy-image?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w780${img.file_path}`)}`,
              type: 'banner' as const,
              loaded: false
            }));

            formattedImages = [...posters, ...backdrops]
              .sort(() => Math.random() - 0.5)
              .slice(0, 50);
          } else {
            formattedImages = (data.backdrops || [])
              .map((img: any) => ({
                url: `/api/proxy-image?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w780${img.file_path}`)}`,
                type: 'banner' as const,
                loaded: false
              }))
              .slice(0, 50);
          }
          
          setImages(formattedImages);
        } catch (error) {
          console.error("Erro ao buscar imagens:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchImages();
  }, [selectedMovie?.id, type]);

  const handleImageLoad = useCallback((imageUrl: string) => {
    setImages(prev => {
      const imageIndex = prev.findIndex(img => img.url === imageUrl);
      if (imageIndex === -1) return prev;
      
      const newImages = [...prev];
      newImages[imageIndex] = { ...prev[imageIndex], loaded: true };
      return newImages;
    });
  }, []);

  const handleImageError = useCallback((imageUrl: string) => {
    setImages(prev => prev.filter(img => img.url !== imageUrl));
  }, []);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowSearchCommand(false);
    setLoading(true); // Ativa o loading ao selecionar um filme
  };

  const handleBackToSearch = () => {
    setSelectedMovie(null);
    setShowSearchCommand(true);
    setSelectedImage(null);
    setCroppedImage(null);
    setShowCropper(false);
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowCropper(true);
  };

  const handleSaveImage = async () => {
    if (!croppedImage) {
      console.error('Imagem não selecionada');
      return;
    }
    
    try {
      setSaving(true);
      console.log('=== INÍCIO DO PROCESSO DE SALVAMENTO ===');
      
      // Verifica autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('Usuário não autenticado')
      }
      console.log('✅ Usuário autenticado:', session.user.id);
      
      // Converte o Data URL para Blob e força o tipo como webp
      console.log('🔄 Convertendo Data URL para Blob...');
      const response = await fetch(croppedImage);
      const originalBlob = await response.blob();
      console.log('✅ Blob original criado:', originalBlob.size, 'bytes');
      
      // Cria um canvas para converter para WebP
      console.log('🔄 Criando canvas para conversão WebP...');
      const img = new Image();
      img.src = croppedImage;
      await new Promise(resolve => img.onload = resolve);
      console.log('✅ Imagem carregada no canvas:', img.width, 'x', img.height);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível criar contexto 2d');
      
      // Desenha a imagem no canvas
      ctx.drawImage(img, 0, 0);
      
      // Converte para WebP com alta qualidade
      console.log('🔄 Convertendo para WebP...');
      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao converter para WebP'));
        }, 'image/webp', 0.95);
      });
      
      console.log('✅ WebP criado:', {
        originalSize: originalBlob.size,
        webpSize: webpBlob.size,
        type: webpBlob.type
      });
      
      // Nome baseado no tipo e ID apropriado
      let fileName: string;
      if (type === 'list') {
        if (!listId) {
          throw new Error('listId é obrigatório para banners de lista');
        }
        fileName = `list-${listId}.webp`;
      } else {
        fileName = `${type}-${session.user.id}.webp`;
      }
      
      let filePath = type === 'list' ? `lists/${fileName}` : `${type}s/${fileName}`;
      console.log('📁 Salvando em:', filePath);
      
      // Estratégia de upload mais robusta
      console.log('🔄 Iniciando upload para Supabase Storage...');
      
      // Primeiro, tenta remover o arquivo antigo se existir
      console.log('🔄 Verificando se arquivo antigo existe...');
      const { data: existingFiles } = await supabase.storage
        .from('profile-images')
        .list(type === 'list' ? 'lists' : `${type}s`, {
          search: fileName
        });
      
      if (existingFiles && existingFiles.length > 0) {
        console.log('🔄 Arquivo antigo encontrado, removendo...');
        const { error: removeError } = await supabase.storage
          .from('profile-images')
          .remove([filePath]);
        
        if (removeError) {
          console.error('❌ Erro ao remover arquivo antigo:', removeError);
          // Continua mesmo com erro na remoção
        } else {
          console.log('✅ Arquivo antigo removido com sucesso');
        }
      }
      
      // Agora faz o upload do novo arquivo
      console.log('🔄 Fazendo upload do novo arquivo...');
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '0' // Desabilita cache para forçar atualização
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        console.error('❌ Detalhes do erro:', {
          message: uploadError.message
        });
        
        // Se o erro for de conflito, tenta uma abordagem diferente
        if (uploadError.message?.includes('already exists') || uploadError.message?.includes('duplicate')) {
          console.log('🔄 Tentando abordagem alternativa com nome único...');
          
          // Gera um nome único com timestamp
          const timestamp = Date.now();
          const uniqueFileName = `${type === 'list' ? 'list' : type}-${type === 'list' ? listId : session.user.id}-${timestamp}.webp`;
          const uniqueFilePath = type === 'list' ? `lists/${uniqueFileName}` : `${type}s/${uniqueFileName}`;
          
          console.log('🔄 Tentando upload com nome único:', uniqueFilePath);
          
          const { error: uniqueUploadError } = await supabase.storage
            .from('profile-images')
            .upload(uniqueFilePath, webpBlob, {
              contentType: 'image/webp',
              cacheControl: '0'
            });
          
          if (uniqueUploadError) {
            console.error('❌ Erro no upload com nome único:', uniqueUploadError);
            throw uniqueUploadError;
          }
          
          // Atualiza o filePath para usar o novo nome
          filePath = uniqueFilePath;
          console.log('✅ Upload com nome único realizado com sucesso');
        } else {
          throw uploadError;
        }
      } else {
        console.log('✅ Upload realizado com sucesso');
      }

      console.log('✅ Upload realizado com sucesso');

      // Pega a URL pública do arquivo com timestamp para evitar cache
      const timestamp = Date.now();
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${timestamp}`;
      console.log('🔗 URL obtida:', urlWithTimestamp);

      // Se customSave foi fornecido, use-o (para listas)
      if (customSave) {
        console.log('🔄 Executando customSave...');
        try {
          await customSave(urlWithTimestamp);
          console.log('✅ Custom save executado com sucesso');
        } catch (customError) {
          console.error('❌ Erro no customSave:', customError);
          throw customError;
        }
      } else {
        // Atualiza o perfil com a nova URL (apenas para avatar/banner)
        if (type === 'avatar' || type === 'banner') {
          console.log('🔄 Atualizando perfil do usuário...');
          const { error: updateError } = await supabase
            .from('users')
            .update({
              [`${type}_url`]: urlWithTimestamp
            })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar perfil:', updateError);
            throw updateError;
          }

          console.log('✅ Perfil atualizado');
          refreshProfile()
        }
      }

      console.log('✅ Processo finalizado com sucesso');
      onSave(urlWithTimestamp);
    } catch (error) {
      console.error('❌ Erro completo ao salvar imagem:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Mensagem do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      // Exibir erro mais amigável para o usuário
      let errorMessage = 'Erro ao salvar imagem';
      
      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          errorMessage = 'Erro no armazenamento. Verifique sua conexão e tente novamente.';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Erro de autenticação. Faça login novamente.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      // Aqui você pode adicionar um toast ou alert para mostrar o erro ao usuário
      alert(errorMessage);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <>
      <CommandDialog 
        open={isOpen && showSearchCommand} 
        onOpenChange={onClose}
      >
        <CommandInput
          placeholder="Search"
          value={query}
          onValueChange={setQuery}
          className=""
        />
        <CommandList className="h-full max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!loading && results.length === 0 && query && (
            <CommandEmpty>Nenhum filme encontrado.</CommandEmpty>
          )}
          {!loading && results.length > 0 && (
          <CommandGroup className="gap-2" heading="Select a film">
            <DialogTitle className="flex items-center gap-2 text-sm"></DialogTitle>
             {results.map((movie) => (
               <CommandItem className="my-4 mx-3"
               key={movie.id} 
               style={{
                padding: '0px'
               }}
              value={movie.title || ""}
              data-cmdk-no-filter
              onSelect={() => {
                handleMovieSelect(movie)
                setOpen(false)
              }}
            >
                <div className="flex flex-col w-full items-center relative">
                  {movie.backdrop_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`}
                      alt={movie.title || ""}
                      className="h-48 w-full object-cover rounded"
                    />
                  ) : movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342/${movie.poster_path}`}
                      alt={movie.title || ""}
                      className="h-48 w-full object-cover rounded"
                    />
                  ) : (
                    <div className="h-48 w-full bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground">Sem imagem disponível</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded bg-black/60 flex items-center justify-center p-4">
                    <p className="font-bold text-center text-white ">{movie.title}</p>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <Dialog open={isOpen && !showSearchCommand && !showCropper} onOpenChange={onClose}>
        
        <DialogContent className="dialog-content ">
          <DialogHeader className="dialog-header h-fit">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToSearch}
                className="h-8 w-8 "
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {selectedMovie?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="dialog-content-scroll custom-scrollbar">
            <ReactMasonryCss
              breakpointCols={{
                default: 3,
                1080: 2,
                640: 1
              }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
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
                    <Skeleton style={{
                      aspectRatio: index % 2 === 0 ? '2/3' : '16/9'
                    }}  className="h-full w-full skeleton " />
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
                    <img
                      src={image.url}
                      alt={`${selectedMovie?.title} ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageSelect(image.url)}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => handleImageLoad(image.url)}
                      onError={() => handleImageError(image.url)}
                    />
                  </div>
                ))
              )}
            </ReactMasonryCss>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen && showCropper} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Imagem</DialogTitle>
          </DialogHeader>
          {showCropper && selectedImage && (
            <div className="p-4">
              <ImageCropper
                image={selectedImage}
                aspect={type === 'avatar' ? 1 : 16/9}
                onCrop={setCroppedImage}
                type={type}
              />
            </div>
          )}
          <DialogFooter className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropper(false);
                setSelectedImage(null);
                setCroppedImage(null);
              }}
            >
              Voltar
            </Button>
            <Button
              onClick={handleSaveImage}
              disabled={saving || !croppedImage}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
