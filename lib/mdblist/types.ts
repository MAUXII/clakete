/** Tipos da API MDBList (ratings agregados). */

export type MdbListMediaType = "movie" | "show";

export type MdbListRatingSourceId =
  | "imdb"
  | "tomatoes"
  | "popcorn"
  | "metacritic"
  | "letterboxd"
  | "trakt"
  | "tmdb";

export type MdbListRawRating = {
  source?: string | null;
  value?: number | string | null;
  score?: number | string | null;
  votes?: number | string | null;
  url?: string | number | null;
  /** 1 = Certified Fresh (Tomatometer), quando a API envia. */
  fresh?: number | boolean | string | null;
};

export type MdbListIds = {
  tmdb?: number | string | null;
  imdb?: string | null;
  trakt?: number | string | null;
};

export type MdbListTitleResponse = {
  title?: string;
  year?: number;
  type?: string;
  ids?: MdbListIds;
  ratings?: MdbListRawRating[];
  score?: number | null;
  score_average?: number | null;
};

export type DisplayScale = "10" | "100" | "percent" | "5";

export type FilmExternalRating = {
  id: MdbListRatingSourceId;
  label: string;
  /** Valor nativo do provedor (quando disponível). */
  value: number;
  /** Score normalizado 0–100 (MDBList). */
  score100: number | null;
  votes: number | null;
  /** Texto pronto p/ UI, ex: `8.7/10`, `92%`. */
  display: string;
  scale: DisplayScale;
  href: string | null;
  /** Certified Fresh (RT critics), se a API indicar. */
  certifiedFresh?: boolean;
};
