"use client";

import { useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PlaybackOptionsResponse = {
  ownUrl: string | null;
  iframeSources: { id: string; label: string; url: string }[];
};

type FilmPlaybackPlayerProps = {
  filmId: number;
  title: string;
  posterPath?: string | null;
};

const OWN_KEY = "own";

export function FilmPlaybackPlayer({ filmId, title, posterPath }: FilmPlaybackPlayerProps) {
  const [options, setOptions] = useState<PlaybackOptionsResponse | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(OWN_KEY);
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setStarted(false);
    setOptions(null);
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/movies/${filmId}/playback-options`);
        const data: unknown = await res.json();
        if (cancelled) return;
        if (
          typeof data === "object" &&
          data !== null &&
          "iframeSources" in data &&
          Array.isArray((data as PlaybackOptionsResponse).iframeSources)
        ) {
          const parsed = data as PlaybackOptionsResponse;
          const iframeSources = parsed.iframeSources.filter(
            (s) =>
              s &&
              typeof s.id === "string" &&
              typeof s.url === "string" &&
              typeof s.label === "string"
          );
          const ownUrl =
            typeof parsed.ownUrl === "string" && parsed.ownUrl
              ? parsed.ownUrl
              : null;
          setOptions({ ownUrl, iframeSources });
          setSelectedKey(
            ownUrl ? OWN_KEY : iframeSources[0]?.id ?? OWN_KEY
          );
        } else {
          setOptions({ ownUrl: null, iframeSources: [] });
          setSelectedKey(OWN_KEY);
        }
      } catch {
        if (!cancelled) {
          setOptions({ ownUrl: null, iframeSources: [] });
          setSelectedKey(OWN_KEY);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filmId]);

  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w780${posterPath}`
    : null;

  const useDirectPlayer = selectedKey === OWN_KEY && Boolean(options?.ownUrl);
  const iframeUrl = useMemo(() => {
    if (!options || selectedKey === OWN_KEY) return null;
    return options.iframeSources.find((s) => s.id === selectedKey)?.url ?? null;
  }, [options, selectedKey]);

  const sectionShell = (children: ReactNode) => (
    <section
      className="mt-6 rounded-xl border border-black/10 bg-muted/30 p-4 dark:border-white/10"
      aria-label="Reprodução"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Assistir
      </h2>
      {children}
    </section>
  );

  if (!options) {
    return sectionShell(
      <div
        className="mx-auto aspect-video w-full max-w-3xl animate-pulse rounded-lg bg-muted"
        aria-busy
        aria-label="Carregando opções de reprodução"
      />
    );
  }

  const selectItems: { value: string; label: string }[] = [];
  if (options.ownUrl) {
    selectItems.push({ value: OWN_KEY, label: "Arquivo / CDN próprio (MP4…)" });
  }
  for (const s of options.iframeSources) {
    selectItems.push({ value: s.id, label: s.label });
  }

  if (selectItems.length === 0) {
    return sectionShell(
      <div className="mx-auto max-w-3xl rounded-lg border border-dashed border-black/15 bg-background/50 px-4 py-8 text-center dark:border-white/15">
        <p className="text-sm text-muted-foreground">
          Nenhuma fonte de reprodução disponível. Adicione{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
            FILM_PLAYBACK_URL_TEMPLATE
          </code>{" "}
          e/ou{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
            FILM_SOURCE_IFRAME_OVERRIDES_JSON
          </code>{" "}
          no servidor.
        </p>
      </div>
    );
  }

  const handleAssistir = () => {
    setStarted(true);
    if (useDirectPlayer && options.ownUrl) {
      requestAnimationFrame(() => {
        void videoRef.current?.play().catch(() => {});
      });
    }
  };

  const handleSourceChange = (value: string) => {
    setSelectedKey(value);
    setStarted(false);
  };

  const hintBelowButton = useDirectPlayer ? (
    <p className="max-w-sm text-xs text-white/80">
      Você também pode clicar fora do botão, na imagem, para começar.
    </p>
  ) : (
    <p className="max-w-sm text-xs text-white/80">
      Player externo (iframe). Troque a fonte acima para comparar provedores.
    </p>
  );

  return sectionShell(
    <div className="space-y-3">
      <div className="mx-auto max-w-3xl space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={`playback-source-${filmId}`}>
          Fonte
        </label>
        <Select value={selectedKey} onValueChange={handleSourceChange}>
          <SelectTrigger id={`playback-source-${filmId}`} className="w-full max-w-3xl">
            <SelectValue placeholder="Escolha a fonte" />
          </SelectTrigger>
          <SelectContent>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Links que não usam só o TMDB (ex.: watch.brstream.cc) podem ser mapeados por filme em{" "}
          <code className="rounded bg-muted px-1 font-mono text-[11px]">FILM_SOURCE_IFRAME_OVERRIDES_JSON</code>.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-lg bg-black ring-1 ring-black/20 dark:ring-white/10">
        {!started ? (
          <div
            className="relative aspect-video w-full cursor-pointer outline-none"
            onClick={handleAssistir}
            style={
              posterUrl
                ? {
                    backgroundImage: `url(${posterUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Button
                type="button"
                size="lg"
                className="gap-2 bg-[#FF0048] text-white hover:bg-[#FF0048]/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssistir();
                }}
              >
                <Play className="size-5 fill-current" aria-hidden />
                Assistir
              </Button>
              {hintBelowButton}
            </div>
          </div>
        ) : useDirectPlayer && options.ownUrl ? (
          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
              src={options.ownUrl}
              aria-label={`Reproduzir ${title}`}
            >
              Seu navegador não suporta reprodução de vídeo embutida.
            </video>
          </div>
        ) : iframeUrl ? (
          <div className="relative aspect-video w-full">
            <iframe
              key={iframeUrl}
              title={`${title} — ${selectedKey}`}
              src={iframeUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
