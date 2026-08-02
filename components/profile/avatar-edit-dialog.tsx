import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { ImageCropper } from "./image-cropper";
import { Movie } from "@/lib/tmdb/client";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Upload } from "lucide-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/components/providers/profile-provider";
import { useLocalePrefs } from "@/hooks/use-locale-prefs";
import ReactMasonryCss from "react-masonry-css";
import type { Area } from "react-easy-crop";

import type { ListBannerMeta } from "@/types/list";
import type { TmdbStoredImageMeta } from "@/types/tmdb-stored-image";
import { buildListBannerMeta } from "@/lib/list-banner";
import { buildTmdbStoredImageMeta } from "@/lib/tmdb-stored-image";
import type { Json } from "@/lib/supabase/database.types";
import { setHomeBackdropInsidePreferences } from "@/lib/user-home-preferences";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { useT } from "@/components/providers/i18n-provider";
import { ShiningBadge } from "@/components/premium/shining-badge";
import { toast } from "sonner";

function normalizeMovieApiRow(row: Record<string, unknown>): Movie {
  return {
    id: row.id as number,
    title: (row.title as string) ?? null,
    poster_path: (row.poster_path as string | null) ?? null,
    backdrop_path: (row.backdrop_path as string | null) ?? null,
    release_date: (row.release_date as string | null) ?? null,
    overview: (row.overview as string | null) ?? null,
    vote_average: (row.vote_average as number | null) ?? null,
    genre_ids: (row.genre_ids as number[] | null) ?? null,
    media_type: "movie",
  }
}

function normalizeTvApiRow(row: Record<string, unknown>): Movie {
  return {
    id: row.id as number,
    title: (row.name as string) ?? null,
    poster_path: (row.poster_path as string | null) ?? null,
    backdrop_path: (row.backdrop_path as string | null) ?? null,
    release_date: (row.first_air_date as string | null) ?? null,
    overview: (row.overview as string | null) ?? null,
    vote_average: (row.vote_average as number | null) ?? null,
    genre_ids: (row.genre_ids as number[] | null) ?? null,
    media_type: "tv",
  }
}

interface ImageEditDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  onClose: () => void;
  onSave: (image: string) => void;
  type: 'avatar' | 'banner' | 'list' | 'home_backdrop';
  onSelect: (image: string) => void;
  isOpen?: boolean;
  customSave?: (imageUrl: string) => Promise<void>;
  /** Salva apenas meta TMDB + crop (sem upload Storage). Para `type="list"` + listId. */
  customListBannerSave?: (meta: ListBannerMeta) => Promise<void>;
  /** Persistência local (ex.: onboarding antes de existir row em `users`). */
  customTmdbMetaSave?: (meta: TmdbStoredImageMeta) => Promise<void>;
  listId?: string;
}

export function ImageEditDialog({ onClose, onSelect, isOpen, onSave, type, customSave, customListBannerSave, customTmdbMetaSave, listId }: ImageEditDialogProps) {
  const bannerAspect = 1152 / 487
  const listMetaFlow = type === "list" && Boolean(customListBannerSave && listId)
  /** Lista (meta) ou perfil avatar/banner/home_backdrop: grava só JSON TMDB+crop; sem blob Storage. */
  const tmdbMetaOnlyFlow =
    listMetaFlow ||
    type === "avatar" ||
    type === "banner" ||
    type === "home_backdrop"

  const [showSearchCommand, setShowSearchCommand] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [images, setImages] = useState<
    {
      url: string
      type: "poster" | "banner"
      aspectRatio: number
      loaded: boolean
      tmdb_file_path?: string | null
    }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedTmdbFilePath, setSelectedTmdbFilePath] = useState<string | null>(null)
  const [listCropGeometry, setListCropGeometry] = useState<{
    pixelCrop: Area
    imageWidth: number
    imageHeight: number
  } | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [customUploadFile, setCustomUploadFile] = useState<File | null>(null)
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useSupabaseClient()
  const debouncedQuery = useDebounce(query, 300)
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Movie[]>([])
  const { refreshProfile } = useProfile()
  const { localeQs, loading: localeLoading } = useLocalePrefs()
  const { isShining } = useSubscription()
  const { t } = useT()
  const allowCustomUpload =
    isShining && (type === "avatar" || type === "banner")
  const isCustomGif = Boolean(
    customUploadFile && customUploadFile.type === "image/gif",
  )
  const useStorageBlobFlow = Boolean(customUploadFile) || !tmdbMetaOnlyFlow

  const revokeCustomPreview = useCallback(() => {
    if (customPreviewUrl) {
      URL.revokeObjectURL(customPreviewUrl)
      setCustomPreviewUrl(null)
    }
  }, [customPreviewUrl])

  const handleListCropGeometry = useCallback(
    (geo: { pixelCrop: Area; imageWidth: number; imageHeight: number }) => {
      setListCropGeometry(geo)
    },
    [],
  )

  useEffect(() => {
    setListCropGeometry(null)
  }, [selectedImage])

  useEffect(() => {
    return () => {
      if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl)
    }
  }, [customPreviewUrl])

  const handleCustomFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !allowCustomUpload) return

    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ])
    if (!allowed.has(file.type)) {
      toast.error(t("prefs.uploadInvalidType"))
      return
    }
    const maxBytes =
      file.type === "image/gif" ? 8 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error(t("prefs.uploadTooLarge"))
      return
    }

    revokeCustomPreview()
    const previewUrl = URL.createObjectURL(file)
    setCustomPreviewUrl(previewUrl)
    setCustomUploadFile(file)
    setSelectedMovie(null)
    setSelectedTmdbFilePath(null)
    setListCropGeometry(null)
    setShowSearchCommand(false)
    setSelectedImage(previewUrl)

    if (file.type === "image/gif") {
      setCroppedImage(previewUrl)
      setShowCropper(true)
    } else {
      setCroppedImage(null)
      setShowCropper(true)
    }
  }

  useEffect(() => {
    const MOVIE_PICKER_PAGES = 2
    const dedupeByMedia = (rows: Movie[]) => {
      const seen = new Set<string>()
      return rows.filter((m) => {
        const key = `${m.media_type ?? "movie"}:${String(m.id)}`
        if (!m?.id || seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    const fetchMovies = async () => {
      if (localeLoading) return
      setLoading(true)
      try {
        const q = debouncedQuery.trim()
        if (q.length === 0) {
          const movieUrls = Array.from(
            { length: MOVIE_PICKER_PAGES },
            (_, i) => `/api/movies?type=top_rated&page=${String(i + 1)}&${localeQs}`,
          )
          const tvUrls = Array.from(
            { length: MOVIE_PICKER_PAGES },
            (_, i) => `/api/tv?type=top_rated&page=${String(i + 1)}&${localeQs}`,
          )
          const specs = [
            ...movieUrls.map((u) => ({ u, kind: "movie" as const })),
            ...tvUrls.map((u) => ({ u, kind: "tv" as const })),
          ]
          const responses = await Promise.all(specs.map((s) => fetch(s.u)))
          const payloads = await Promise.all(responses.map((r) => r.json()))
          const merged: Movie[] = []
          for (let i = 0; i < payloads.length; i++) {
            const data = payloads[i]
            const kind = specs[i].kind
            if (!Array.isArray(data?.results)) continue
            for (const row of data.results as Record<string, unknown>[]) {
              merged.push(
                kind === "tv" ? normalizeTvApiRow(row) : normalizeMovieApiRow(row),
              )
            }
          }
          merged.sort(
            (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0),
          )
          setResults(dedupeByMedia(merged))
        } else {
          const res = await fetch(
            `/api/movies/search?q=${encodeURIComponent(q)}&page=1&include_tv=1&${localeQs}`,
          )
          const data = await res.json()
          const rows = Array.isArray(data?.results) ? data.results : []
          setResults(dedupeByMedia(rows as Movie[]))
        }
      } catch (error) {
        console.error("Erro ao buscar filmes:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    void fetchMovies()
  }, [debouncedQuery, localeQs, localeLoading])

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
          const mt = selectedMovie.media_type ?? "movie"
          const response = await fetch(
            `/api/movies/${String(selectedMovie.id)}/images?media_type=${mt}`,
          )
          const data = await response.json();
          
          type TmdbImage = { file_path: string; vote_average?: number }

          const byVotes = (a: TmdbImage, b: TmdbImage) =>
            (b.vote_average ?? 0) - (a.vote_average ?? 0)

          const mapPoster = (img: TmdbImage) => ({
            url: `/api/proxy-image?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w780${img.file_path}`)}`,
            type: "poster" as const,
            aspectRatio: 2 / 3,
            loaded: false,
            tmdb_file_path: img.file_path,
          })

          const mapBackdrop = (img: TmdbImage) => ({
            url: `/api/proxy-image?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w1280${img.file_path}`)}`,
            type: "banner" as const,
            aspectRatio: 16 / 9,
            loaded: false,
            tmdb_file_path: img.file_path,
          })

          const posters = ([...(data.posters || [])] as TmdbImage[])
            .sort(byVotes)
            .map(mapPoster)

          const backdrops = ([...(data.backdrops || [])] as TmdbImage[])
            .sort(byVotes)
            .map(mapBackdrop)

          // Mix posters + backdrops for masonry (all images, no hard cap).
          const mixed = [...posters, ...backdrops]
          for (let i = mixed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[mixed[i], mixed[j]] = [mixed[j], mixed[i]]
          }

          setImages(mixed);
        } catch (error) {
          console.error("Erro ao buscar imagens:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchImages();
  }, [selectedMovie?.id, selectedMovie?.media_type, type]);

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
    setSelectedTmdbFilePath(null)
    setListCropGeometry(null)
    setCroppedImage(null);
    setShowCropper(false);
    setCustomUploadFile(null)
    revokeCustomPreview()
  };

  const handleImageSelect = (imageUrl: string, tmdbFilePath?: string | null) => {
    const fp = typeof tmdbFilePath === "string" ? tmdbFilePath.trim() : ""
    const cropSrc =
      fp.length > 0
        ? `/api/proxy-image?url=${encodeURIComponent(`https://image.tmdb.org/t/p/original${fp}`)}`
        : imageUrl
    setSelectedImage(cropSrc)
    setSelectedTmdbFilePath(fp.length > 0 ? fp : null)
    setListCropGeometry(null)
    setCroppedImage(null)
    setShowCropper(true)
  };

  const handleSaveImage = async () => {
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error("Usuário não autenticado")
      }

      /* REDRUM: upload direto de GIF (sem crop — mantém animação). */
      if (
        customUploadFile &&
        customUploadFile.type === "image/gif" &&
        (type === "avatar" || type === "banner")
      ) {
        if (!isShining) {
          throw new Error("Upload próprio é exclusivo The Shining (REDRUM).")
        }
        const fileName = `${type}-${session.user.id}.gif`
        const filePath = `${type}s/${fileName}`
        await supabase.storage.from("profile-images").remove([filePath])
        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(filePath, customUploadFile, {
            contentType: "image/gif",
            cacheControl: "3600",
            upsert: true,
          })
        if (uploadError) throw uploadError
        const timestamp = Date.now()
        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-images").getPublicUrl(filePath)
        const urlWithTimestamp = `${publicUrl}?t=${timestamp}`
        const metaKey = type === "avatar" ? "avatar_meta" : "banner_meta"
        const urlKey = type === "avatar" ? "avatar_url" : "banner_url"
        if (customSave) {
          await customSave(urlWithTimestamp)
        } else {
          const { error: updateError } = await supabase
            .from("users")
            .update({
              [urlKey]: urlWithTimestamp,
              [metaKey]: null,
            })
            .eq("id", session.user.id)
          if (updateError) throw updateError
          await refreshProfile()
        }
        onSave(urlWithTimestamp)
        toast.success(t("profile.imageSaved"))
        return
      }

      /* Lista: só TMDB path + crop, sem Storage */
      if (listMetaFlow && customListBannerSave && listId && selectedTmdbFilePath && listCropGeometry) {
        const meta = buildListBannerMeta(
          selectedTmdbFilePath,
          listCropGeometry.pixelCrop,
          listCropGeometry.imageWidth,
          listCropGeometry.imageHeight,
        )
        await customListBannerSave(meta)
        toast.success(t("profile.imageSaved"))
        onSave("")
        return
      }

      /* Perfil: meta em avatar_meta/banner_meta; home backdrop vive só em users.home_preferences (JSON). */
      if (
        !customUploadFile &&
        (type === "avatar" || type === "banner" || type === "home_backdrop") &&
        selectedTmdbFilePath &&
        listCropGeometry
      ) {
        const meta = buildTmdbStoredImageMeta(
          selectedTmdbFilePath,
          listCropGeometry.pixelCrop,
          listCropGeometry.imageWidth,
          listCropGeometry.imageHeight,
        )
        if (type === "home_backdrop") {
          const { data: row, error: selErr } = await supabase
            .from("users")
            .select("home_preferences")
            .eq("id", session.user.id)
            .maybeSingle()
          if (selErr) throw selErr
          const nextPrefs = setHomeBackdropInsidePreferences(row?.home_preferences ?? null, {
            url: null,
            meta: meta as unknown as Json,
          })
          const { error: profileMetaErr } = await supabase
            .from("users")
            .update({ home_preferences: nextPrefs })
            .eq("id", session.user.id)
          if (profileMetaErr) throw profileMetaErr
          await refreshProfile()
          toast.success(t("profile.imageSaved"))
          onSave("")
          return
        }
        if (customTmdbMetaSave) {
          await customTmdbMetaSave(meta)
          toast.success(t("profile.imageSaved"))
          onSave("")
          return
        }
        const metaKey = type === "avatar" ? "avatar_meta" : "banner_meta"
        const urlKey = type === "avatar" ? "avatar_url" : "banner_url"
        const { error: profileMetaErr } = await supabase
          .from("users")
          .update({
            [metaKey]: meta,
            [urlKey]: null,
          })
          .eq("id", session.user.id)
        if (profileMetaErr) throw profileMetaErr
        await refreshProfile()
        toast.success(t("profile.imageSaved"))
        onSave("")
        return
      }

      if (!croppedImage) {
        toast.error(t("profile.chooseCropFirst"))
        return
      }

      const img = new Image();
      img.src = croppedImage;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível criar contexto 2d');

      ctx.drawImage(img, 0, 0);

      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao converter para WebP'));
        }, 'image/webp', 0.95);
      });

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

      const { data: existingFiles } = await supabase.storage
        .from('profile-images')
        .list(type === 'list' ? 'lists' : `${type}s`, {
          search: fileName
        });

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from('profile-images').remove([filePath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600'
        });

      if (uploadError) {
        if (uploadError.message?.includes('already exists') || uploadError.message?.includes('duplicate')) {
          const timestamp = Date.now();
          const uniqueFileName = `${type === 'list' ? 'list' : type}-${type === 'list' ? listId : session.user.id}-${timestamp}.webp`;
          const uniqueFilePath = type === 'list' ? `lists/${uniqueFileName}` : `${type}s/${uniqueFileName}`;

          const { error: uniqueUploadError } = await supabase.storage
            .from('profile-images')
            .upload(uniqueFilePath, webpBlob, {
              contentType: 'image/webp',
              cacheControl: '3600'
            });

          if (uniqueUploadError) throw uniqueUploadError;
          filePath = uniqueFilePath;
        } else {
          throw uploadError;
        }
      }

      const timestamp = Date.now();
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${timestamp}`;

      if (customSave) {
        await customSave(urlWithTimestamp);
      } else if (type !== 'list' && (type === 'avatar' || type === 'banner')) {
        const metaKey = type === "avatar" ? "avatar_meta" : "banner_meta"
        const { error: updateError } = await supabase
          .from('users')
          .update({
            [`${type}_url`]: urlWithTimestamp,
            ...(customUploadFile ? { [metaKey]: null } : {}),
          })
          .eq('id', session.user.id);

        if (updateError) throw updateError;
        refreshProfile()
      }

      toast.success(t("profile.imageSaved"))
      onSave(urlWithTimestamp);
    } catch (error) {
      let errorMessage = t("profile.imageSaveError");

      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          errorMessage = t("profile.storageError");
        } else if (error.message.includes('auth')) {
          errorMessage = t("profile.authError");
        } else if (error.message.includes('network')) {
          errorMessage = t("profile.networkError");
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
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
        contentClassName={cn(
          "max-w-[min(92vw,26rem)] border-0 bg-[#09090b] shadow-none ring-1 ring-white/[0.06]",
          "sm:max-w-md",
        )}
        commandClassName={cn(
          "rounded-xl bg-[#09090b]",
          "[&_[cmdk-input-wrapper]]:mx-2 [&_[cmdk-input-wrapper]]:mt-3 [&_[cmdk-input-wrapper]]:mb-3 [&_[cmdk-input-wrapper]]:rounded-lg",
          "[&_[cmdk-input-wrapper]]:border [&_[cmdk-input-wrapper]]:border-border [&_[cmdk-input-wrapper]]:bg-[#141416]",
          "[&_[cmdk-input-wrapper]]:px-3 [&_[cmdk-input-wrapper]]:py-2",
          "[&_[cmdk-input]]:h-8 [&_[cmdk-input]]:text-[13px] [&_[cmdk-input]]:placeholder:text-muted-foreground",
          "[&_[cmdk-input-wrapper]_svg]:h-3.5 [&_[cmdk-input-wrapper]_svg]:w-3.5 [&_[cmdk-input-wrapper]_svg]:text-muted-foreground",
          "[&_[cmdk-group]]:!pr-2 [&_[cmdk-group]]:!pt-0",
          "[&_[cmdk-item]]:!mb-2 [&_[cmdk-item]]:!overflow-hidden [&_[cmdk-item]]:!rounded-xl [&_[cmdk-item]]:!p-0",
          "[&_[cmdk-item][data-selected=true]]:!bg-transparent",
          "[&_[cmdk-empty]]:!py-12 [&_[cmdk-empty]]:!text-[13px] [&_[cmdk-empty]]:!text-muted-foreground",
        )}
      >
        <CommandInput
          placeholder={t("profile.searchFilmsTv")}
          value={query}
          onValueChange={setQuery}
          className="placeholder:text-muted-foreground "
        />
        {allowCustomUpload ? (
          <div className="mx-2 mb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleCustomFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-[#141416] px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
            >
              <Upload className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  {t("prefs.uploadOwnImage")}
                  <ShiningBadge size="sm" />
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {t("prefs.uploadOwnImageHint")}
                </span>
              </span>
            </button>
          </div>
        ) : null}
        <CommandList className="custom-scrollbar max-h-[min(58vh,528px)] overflow-y-auto pb-3">
          {loading ? (
            <div className="space-y-2 px-2" aria-busy aria-label="Searching">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={`sk-${String(i)}`}
                  className="aspect-[16/9] w-full shrink-0 rounded-xl bg-muted/90"
                />
              ))}
            </div>
          ) : null}
          {!loading && results.length === 0 && query.trim().length > 0 ? (
            <CommandEmpty>{t("profile.noFilmsOrSeries")}</CommandEmpty>
          ) : null}
          {!loading && results.length > 0 ? (
            <CommandGroup>
              {results.map((movie) => {
                const year = movie.release_date?.slice(0, 4) ?? null;
                const banner =
                  movie.backdrop_path?.trim()?.length ?
                    `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                  : movie.poster_path?.trim()?.length ?
                    `https://image.tmdb.org/t/p/w780${movie.poster_path}`
                  : null;

                return (
                  <CommandItem
                    key={`${movie.media_type ?? "movie"}-${String(movie.id)}`}
                    value={`${movie.media_type ?? "movie"} ${movie.title ?? ""} ${String(movie.id)}`}
                    data-cmdk-no-filter
                    className="cursor-pointer aria-selected:bg-transparent"
                    onSelect={() => {
                      handleMovieSelect(movie);
                      setOpen(false);
                    }}
                  >
                    <div className="group/card relative isolate aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-white/[0.06]">
                      {movie.media_type === "tv" ? (
                        <span className="absolute left-2 top-2 z-[3] rounded bg-card px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                          TV
                        </span>
                      ) : null}
                      {banner ? (
                        <img
                          src={banner}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover object-center transition-[filter] duration-300 ease-out will-change-[filter] group-hover/card:brightness-110"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-[11px] text-muted-foreground transition-colors duration-300 group-hover/card:bg-muted">
                          {t("profile.noBackdrop")}
                        </div>
                      )}
                      <div
                        className="pointer-events-none absolute inset-0 z-[1] bg-[#09090b]/40 transition-colors duration-300 ease-out group-hover/card:bg-[#09090b]/22"
                        aria-hidden
                      />
                      <div className="absolute inset-0 z-[2] flex flex-col justify-end px-3.5 pb-3 pt-10">
                        <div className="flex items-end gap-2.5">
                          <span
                            className="mb-0.5 h-9 w-[2px] shrink-0 rounded-full bg-white"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1 text-left">
                            {year ? (
                              <p className="mb-0.5 text-[10px] font-medium tabular-nums text-red-400">
                                {year}
                              </p>
                            ) : null}
                            <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-white">
                              {movie.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>

      <Dialog open={isOpen && !showSearchCommand && !showCropper} onOpenChange={onClose}>
        <DialogContent className="dialog-content w-[96vw] max-w-6xl">
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
                    className="masonry-item overflow-hidden ring-1 ring ring-white/[0.06]"
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
                    className="masonry-item overflow-hidden ring-1 ring-white/[0.06]"
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
                      onClick={() => handleImageSelect(image.url, image.tmdb_file_path)}
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
        <DialogContent className="w-[82vw] max-w-[38rem] overflow-hidden p-0">
          <DialogHeader className="border-b border-border/50 px-4 py-2.5">
            <DialogTitle>{t("profile.editImage")}</DialogTitle>
          </DialogHeader>
          {showCropper && selectedImage && isCustomGif ? (
            <div className="flex items-center justify-center bg-black px-2 py-4">
              <img
                src={selectedImage}
                alt=""
                className="max-h-[min(70vh,28rem)] w-auto max-w-full rounded-md object-contain"
              />
            </div>
          ) : null}
          {showCropper && selectedImage && !isCustomGif ? (
            <div className="px-2 py-2">
              <ImageCropper
                image={selectedImage}
                aspect={type === 'avatar' ? 1 : bannerAspect}
                onCrop={setCroppedImage}
                type={type === 'home_backdrop' ? 'banner' : type}
                deferWebpBlob={!useStorageBlobFlow}
                onCropGeometry={
                  !useStorageBlobFlow ? handleListCropGeometry : undefined
                }
              />
            </div>
          ) : null}
          <DialogFooter className="mt-0 flex justify-end gap-2 border-t border-border/50 px-4 py-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropper(false);
                setSelectedImage(null);
                setSelectedTmdbFilePath(null);
                setListCropGeometry(null);
                setCroppedImage(null);
                setCustomUploadFile(null);
                revokeCustomPreview();
                setShowSearchCommand(true);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleSaveImage()}
              disabled={
                saving ||
                (isCustomGif
                  ? !customUploadFile
                  : useStorageBlobFlow
                    ? !croppedImage
                    : !(selectedTmdbFilePath && listCropGeometry))
              }
            >
              {saving ? t("profile.saving") : t("profile.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
